export type SubmissionStatus = 'processing' | 'needsReview' | 'published'

export interface Criterion {
  name: string
  maxPoints: number
  aiPoints: number
  aiFeedback: string
  uncertain: boolean
}

export interface Submission {
  id: string
  studentName: string
  assignmentId: string
  status: SubmissionStatus
  recognizedText: string
  criteria: Criterion[]
  overallFeedback: string
}

export interface Assignment {
  id: string
  classId: string
  title: string
  dueDate: string
}

export interface SchoolClass {
  id: string
  name: string
  subject: string
  students: string[]
}

export const classes: SchoolClass[] = [
  {
    id: 'c1',
    name: '4.B',
    subject: 'Matematika',
    students: ['Anna Dvořáková', 'Petr Svoboda', 'Eliška Černá', 'Tomáš Král'],
  },
  { id: 'c2', name: '2.A', subject: 'Fyzika', students: ['Jakub Novotný', 'Klára Veselá'] },
]

export const assignments: Assignment[] = [
  { id: 'a1', classId: 'c1', title: 'Lineární rovnice', dueDate: '2026-12-04' },
  { id: 'a2', classId: 'c1', title: 'Procenta – slovní úlohy', dueDate: '2026-12-11' },
  { id: 'a3', classId: 'c2', title: 'Rovnoměrný pohyb', dueDate: '2026-12-08' },
]

export const submissions: Submission[] = [
  {
    id: 's1',
    studentName: 'Anna Dvořáková',
    assignmentId: 'a1',
    status: 'needsReview',
    recognizedText:
      '1) 2x + 3 = 11 → 2x = 8 → x = 4\n2) 5x − 7 = 3x + 1 → 2x = 8 → x = 4\n3) 3(x − 2) = 9 → x − 2 = 3 → x = 5',
    criteria: [
      {
        name: 'Úloha 1',
        maxPoints: 3,
        aiPoints: 3,
        aiFeedback: 'Správný postup i výsledek.',
        uncertain: false,
      },
      {
        name: 'Úloha 2',
        maxPoints: 4,
        aiPoints: 3,
        aiFeedback: 'Výsledek je správný, chybí zkouška.',
        uncertain: false,
      },
      {
        name: 'Úloha 3',
        maxPoints: 3,
        aiPoints: 2,
        aiFeedback: 'Nečitelný druhý řádek, ověřte prosím postup.',
        uncertain: true,
      },
    ],
    overallFeedback: 'Pěkná práce, příště nezapomeň na zkoušku.',
  },
  {
    id: 's2',
    studentName: 'Petr Svoboda',
    assignmentId: 'a1',
    status: 'published',
    recognizedText: '1) x = 4\n2) x = 4\n3) x = 3',
    criteria: [
      { name: 'Úloha 1', maxPoints: 3, aiPoints: 2, aiFeedback: 'Chybí postup.', uncertain: false },
      { name: 'Úloha 2', maxPoints: 4, aiPoints: 2, aiFeedback: 'Chybí postup.', uncertain: false },
      {
        name: 'Úloha 3',
        maxPoints: 3,
        aiPoints: 0,
        aiFeedback: 'Nesprávný výsledek.',
        uncertain: false,
      },
    ],
    overallFeedback: 'Uváděj prosím celý postup řešení.',
  },
  {
    id: 's3',
    studentName: 'Eliška Černá',
    assignmentId: 'a1',
    status: 'processing',
    recognizedText: '',
    criteria: [],
    overallFeedback: '',
  },
]

export const statusTone = {
  processing: 'neutral',
  needsReview: 'warning',
  published: 'success',
} as const

export function totalPoints(criteria: Criterion[]): { points: number; max: number } {
  return criteria.reduce(
    (sum, criterion) => ({
      points: sum.points + criterion.aiPoints,
      max: sum.max + criterion.maxPoints,
    }),
    { points: 0, max: 0 },
  )
}
