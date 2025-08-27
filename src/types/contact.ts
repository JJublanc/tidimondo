export interface ContactFormData {
  nom: string;
  email: string;
  sujet: string;
  message: string;
}

export interface ContactSubmissionResponse {
  success: boolean;
  message: string;
}