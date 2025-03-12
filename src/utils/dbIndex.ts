import db from "./db";

// function to create the full-text search index
export const createFullTextIndex = async (): Promise<void> => {
  try {
    await db.none(
      `CREATE INDEX IF NOT EXISTS files_full_text_idx
        ON files USING gin(to_tsvector('english', file_name || ' ');`
    );
    console.log('Full-Text Search Index created successfully');
  } catch (error) {
    console.error('Error creating Full-Text Search Index:', error);
  }
};

// Create index when necessary, for example, when setting up your DB
createFullTextIndex();
