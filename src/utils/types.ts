export type UUID = string;

export interface FileInfo{
    id: number,
    created_at: Date,
    file_uuid: UUID,
    file_owner_id: UUID,
    file_path: string,
    file_name: string,
    file_size: number,
    file_type: string
}

export interface User{
    id: number,
    user_id: UUID,
    full_name: string,
    email: string,
    created_at: Date
}

export interface FileObj{
    name: string,
    id: string,
    updated_at: string,
    created_at: string,
    last_accessed_at: string,
    size: number
  }
 
export interface SharedFileInfo{
    accesser_added_at: Date,
    file_uuid: UUID,
    file_name: string,
    owner_id: UUID, 
    owner_email: string,
    owner_name: string,
    accesser_id: UUID,
    accesser_email: string,
    permission_type: string,
    file_size: number
}  

export interface OwnerInfo{
    email: string,
    full_name: string
}

export interface AccesserInfo{
    accesser_id: UUID,
    accesser_email: string,
    permission_type: string
} 

export interface SearchFileInfo{
    file_uuid: UUID,
    file_name: string,
    rank: number
} 

export interface SearchFileData{
    file_name: string,
    file_uuid: UUID,
    created_at: Date,
    file_type: string, 
    file_size: number,
}

export interface CommentInfo{
    file_uuid: UUID, 
    file_name: string, 
    comment_uuid: UUID, 
    owner_id: UUID,
    commenter_id: UUID,
    comment_text: string, 
    created_at: Date
}

export interface CommentTextInfo{
    comment_text: string;
}
