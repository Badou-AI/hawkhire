1. Increase the semaphore limit (currently 3)
2. Batch the API calls (especially embeddings)
3. Pipeline the operations (start next file's text extraction while current file is generating embeddings)
4. Try pushing it further (e.g., 15 or 20 concurrent tasks) to find the optimal limit?
5. Commit this improvement and move on to implementing batch processing for embeddings?
6. Add monitoring to see which API calls (text extraction, embedding, indexing) are taking the most time?
