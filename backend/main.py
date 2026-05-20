from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
from pydantic import BaseModel
import random
import os
from dotenv import load_dotenv
load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Table name in database
TABLE_NAME = "hadiths_v2" 

# In-memory cache to speed up repeated dropdown requests
db_cache = {
    "sources": [],
    "chapters_by_source": {}
}




@app.get("/")
@app.head("/")
def health_check():
    return {"status": "Alhamdulillah, Server is running!"}


@app.get("/sources")
def get_sources():
    # Return from cache if already fetched
    if db_cache["sources"]:
        return {"sources": db_cache["sources"]}

    # Fetch unique books from the SQL view directly
    response = supabase.table("unique_books").select("Book").execute()
    
    # Extract only the book names into a list
    books = [item["Book"] for item in response.data if item.get("Book")]
    
    # Save to cache for future requests
    db_cache["sources"] = books
    
    return {"sources": books}

@app.get("/chapters")
def get_chapters(source: str = Query(...)):
    # Return from cache if this book's chapters are already fetched
    if source in db_cache["chapters_by_source"]:
        return {"chapters": db_cache["chapters_by_source"][source]}

    # Fetch chapters from the SQL view based on the selected book
    response = supabase.table("unique_chapters").select("Chapter_Number, Chapter_Title_English").eq("Book", source).execute()
    
    chapters = response.data
    
    # Save to cache to make the dropdown lightning fast next time
    db_cache["chapters_by_source"][source] = chapters
    
    return {"chapters": chapters}

@app.get("/random-hadith")
def get_random_hadith(source: str = None, chapter_no: int = None):
    # Step 1: Get the EXACT count of matching hadiths without fetching all data
    query = supabase.table(TABLE_NAME).select("*", count="exact")
    
    # Apply filters if provided
    if source:
        query = query.eq("Book", source)
    if chapter_no is not None:
        query = query.eq("Chapter_Number", chapter_no)
        
    # Limit to 1 just to get the count property (bypasses the 1000 row limit)
    count_response = query.limit(1).execute()
    total_count = count_response.count

    if not total_count or total_count == 0:
        return {"error": "No hadith found"}

    # Step 2: Generate a random index between 0 and (total_count - 1)
    random_index = random.randint(0, total_count - 1)

    # Step 3: Fetch exactly ONE random hadith using the random index (Sniper Approach)
    fetch_query = supabase.table(TABLE_NAME).select("*")
    if source:
        fetch_query = fetch_query.eq("Book", source)
    if chapter_no is not None:
        fetch_query = fetch_query.eq("Chapter_Number", chapter_no)
        
    final_response = fetch_query.range(random_index, random_index).limit(1).execute()
    
    if final_response.data:
        return final_response.data[0]
        
    return {"error": "No hadith found"}

@app.get("/hadiths")
def get_paginated_hadiths(
    source: str = None, 
    chapter_no: int = None, 
    page: int = 1, 
    limit: int = 1,
    hadith_no: str = None
):
    target_page = page

    # If searching for a specific hadith number
    if hadith_no:
        # Strip any accidental whitespace from user input
        clean_hadith_no = hadith_no.strip()
        
        # Helper function to build the base query freshly
        def build_find_query():
            q = supabase.table(TABLE_NAME).select("id")
            if source: q = q.eq("Book", source)
            if chapter_no is not None: q = q.eq("Chapter_Number", chapter_no)
            return q
            
        # 1. Try pattern matching first: match ending with " [number]" (e.g., "Book 1, Hadith 12")
        # The space before the number prevents "12" from matching "112"
        target_res = build_find_query().ilike("In-book reference", f"% {clean_hadith_no}").execute()
        
        # 2. If no result found from pattern matching, fallback to exact match just in case
        if not target_res.data:
            target_res = build_find_query().eq("In-book reference", clean_hadith_no).execute()
            
        # If the specific hadith is found, calculate its page position
        if target_res.data:
            target_id = target_res.data[0]["id"]
            
            # Count how many hadiths exist before this specific hadith
            count_query = supabase.table(TABLE_NAME).select("*", count="exact")
            if source: count_query = count_query.eq("Book", source)
            if chapter_no is not None: count_query = count_query.eq("Chapter_Number", chapter_no)
            
            # Get the serial position by counting rows with id <= target_id
            count_res = count_query.lte("id", target_id).limit(1).execute()
            position = count_res.count if count_res.count else 1
            
            # 3. Calculate the exact target page based on position and limit
            target_page = ((position - 1) // limit) + 1

    # Normal pagination logic using the calculated target_page
    main_query = supabase.table(TABLE_NAME).select("*", count="exact")
    if source: main_query = main_query.eq("Book", source)
    if chapter_no is not None: main_query = main_query.eq("Chapter_Number", chapter_no)
    
    start_index = (target_page - 1) * limit
    end_index = start_index + limit - 1
    
    response = main_query.order("id").range(start_index, end_index).execute()
    
    total_count = response.count if response.count else 0
    total_pages = (total_count + limit - 1) // limit if total_count else 0
    
    return {
        "data": response.data,
        "total_count": total_count,
        "current_page": target_page,
        "total_pages": total_pages
    }


# Report data structure
class ReportRequest(BaseModel):
    book_name: str
    hadith_ref: str
    issue_description: str

@app.post("/report-issue")
def report_issue(report: ReportRequest):
    # Insert the user report into Supabase
    response = supabase.table("reports").insert({
        "book_name": report.book_name,
        "hadith_ref": report.hadith_ref,
        "issue_description": report.issue_description
    }).execute()
    
    return {"status": "success", "message": "JazakAllah Khair! Report received."}