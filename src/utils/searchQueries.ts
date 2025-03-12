
//query for file search
const fileSearch = (query: string, limit: number, offset: number): string => {
    return `SELECT file_uuid, file_name, ts_rank(to_tsvector('english', file_name || ' '), to_tsquery('english', $1)) AS rank
             FROM files
             WHERE to_tsvector('english', file_name || ' ') @@ to_tsquery('english', $1)
             ORDER BY rank DESC
             `;
};

export default fileSearch;