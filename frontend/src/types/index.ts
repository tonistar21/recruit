export type User = { id: string; email: string; display_name: string; role: string; role_name: string; permissions: string[]; must_change_password: boolean; candidate_id: string | null };
export type Stage = { id: number; code: string; name: string; position: number };
export type Candidate = { id:string;public_id:string;first_name:string;last_name:string;middle_name?:string;email:string;phone:string;city?:string;region?:string;address?:string;education?:string;speciality?:string;work_experience?:string;skills?:string;languages?:string;desired_direction?:string;desired_position?:string;source?:string;notes?:string;status:string;state:string;stage:Stage;created_at:string;updated_at:string };
export type Page<T> = { items: T[]; total: number; page: number; page_size: number };
export type DocumentItem = { id:string;candidate_id:string;category:string;original_name:string;mime_type:string;size_bytes:number;status:string;reviewer_comment?:string;created_at:string };
