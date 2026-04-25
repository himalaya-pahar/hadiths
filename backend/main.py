from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
import random
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Supabase credentials (WARNING: Keep these secret in production!)
SUPABASE_URL = "https://hznpuoxembyeawtgycke.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6bnB1b3hlbWJ5ZWF3dGd5Y2tlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwNDI4NzksImV4cCI6MjA5MjYxODg3OX0.TE72VtKkD9pPlm0ox2DrhAib84PvR-UY36v3Jcm31sE"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Table name in database
TABLE_NAME = "hadiths" 

# In-memory cache to speed up repeated dropdown requests
db_cache = {
    "sources": [],
    "chapters_by_source": {}
}

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

from pydantic import BaseModel

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