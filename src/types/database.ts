export type UserRole = 'Mpianatra' | 'Mpampianatra' | 'RAD' | 'Admin';

export interface Profile {
  id: string;
  email?: string;
  full_name?: string;
  role?: UserRole;
  avatar_url?: string;
  phone?: string;
  bio?: string;
  created_at?: string;
}

export interface Course {
  id: string;
  title: string;
  description?: string;
  series?: string;
  cover_url?: string;
  published?: boolean;
  created_at?: string;
  class_id?: string | null;
  teacher_id?: string | null;
  status?: string;
  price_mga?: number;
  is_free?: boolean;
}

export interface Lesson {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  content_url?: string | null;
  lesson_order?: number;
  published?: boolean;
  created_at?: string;
  content?: string;
}

export interface LessonProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  completed: boolean;
  completed_at?: string;
}

export interface Quiz {
  id: string;
  course_id?: string;
  lesson_id?: string;
  title: string;
  description?: string;
  time_limit_minutes?: number;
  created_at?: string;
}

export interface Question {
  id: string;
  quiz_id: string;
  question_text: string;
  order_index?: number;
  points?: number;
}

export interface Answer {
  id: string;
  question_id: string;
  answer_text: string;
  is_correct?: boolean;
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  user_id: string;
  score?: number;
  max_score?: number;
  passed?: boolean;
  created_at?: string;
}

export interface QuizAnswer {
  id: string;
  attempt_id: string;
  question_id: string;
  answer_id: string;
  is_correct?: boolean;
}

export interface CourseEnrollment {
  id: string;
  student_id: string;
  course_id: string;
  status?: string;
  enrolled_at?: string;
  created_at?: string;
}

export interface CourseOrder {
  id: string;
  user_id: string;
  course_id: string;
  amount?: number;
  status?: string;
  created_at?: string;
}

export interface CourseResource {
  id: string;
  course_id: string;
  title: string;
  url: string;
  file_type?: string;
}

/* INTERNAL COMMUNITY ARCHITECTURE */
export interface Group {
  id: string;
  name: string;
  description?: string;
  created_by?: string;
  created_at?: string;
}

/* Known existing columns for group_members: group_id, user_id, created_at */
export interface GroupMember {
  group_id: string;
  user_id: string;
  created_at?: string;
  profile?: Profile;
}

export interface GroupMessage {
  id: string;
  group_id: string;
  user_id: string;
  content: string;
  created_at: string;
  sender?: Profile;
}

/* EXTERNAL COMMUNITY LINKS ARCHITECTURE */
/* Real columns in database: id, platform, url, description */
export interface CommunityLink {
  id: string;
  platform: string;
  url: string;
  description?: string;
}

/* DICTIONARY ENTRIES */
/* Real columns in database: id, term, language, definition, translation_fr, translation_en, example, synonyms, subject, active, level */
export interface DictionaryEntry {
  id: string;
  term: string;
  language?: string;
  definition: string;
  translation_fr?: string;
  translation_en?: string;
  example?: string;
  synonyms?: string;
  subject?: string;
  active?: boolean;
  level?: string;
  definition_mg?: string;
  definition_fr?: string;
  definition_en?: string;
  example_mg?: string;
  example_fr?: string;
  pronunciation?: string;
  short_description?: string;
  long_description?: string;
}

/* BOOKS */
/* Real columns in database: id, title, author, description, price_mga, is_free, cover_url, category */
export interface Book {
  id: string;
  title: string;
  author?: string;
  description?: string;
  price_mga?: number;
  is_free?: boolean;
  cover_url?: string;
  category?: string;
}

export interface BookOrder {
  id: string;
  user_id: string;
  book_id: string;
  status?: string;
  created_at?: string;
}

export interface BookAccess {
  id: string;
  user_id: string;
  book_id: string;
  granted_at?: string;
}

export interface TeacherProfile {
  id: string;
  user_id: string;
  bio?: string;
  qualification?: string;
  specialty?: string;
  rating?: number;
}

export interface TeacherService {
  id: string;
  teacher_id: string;
  title: string;
  description?: string;
  price?: number;
  duration?: string;
}
