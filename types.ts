export interface GeneratedEmail {
  subject: string;
  body: string;
}

export interface ArchivedEmail extends GeneratedEmail {
  id: string;
  productDescription: string;
  productUrl: string;
  timestamp: string;
  language: 'ar' | 'en-US';
  recipientTitle?: string;
}