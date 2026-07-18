export type Priority = 'URGENT' | 'MEDIUM' | 'REVISION' | 'EASY'

export interface Task {
  id: string
  category: string
  title: string
  description: string
  priority: Priority
  timeMinutes: number
  date: string
  dayName: string
  completed: boolean
}

export interface StudyDay {
  day: string
  minutes: number
}

export const tasks: Task[] = [
  {
    id: '1',
    category: 'Software Development',
    title: 'Java Basics',
    description: 'Introduction to class structure, syntax, and compilation flow.',
    priority: 'URGENT',
    timeMinutes: 168,
    date: 'Jul 17',
    dayName: 'Fri',
    completed: false,
  },
  {
    id: '2',
    category: 'Data Structures',
    title: 'Arrays & Linked Lists',
    description: 'Understanding static and dynamic data structures with traversal techniques.',
    priority: 'MEDIUM',
    timeMinutes: 120,
    date: 'Jul 18',
    dayName: 'Sat',
    completed: false,
  },
  {
    id: '3',
    category: 'Machine Learning',
    title: 'Linear Regression',
    description: 'Cost function, gradient descent, and model evaluation metrics.',
    priority: 'URGENT',
    timeMinutes: 150,
    date: 'Jul 19',
    dayName: 'Sun',
    completed: false,
  },
  {
    id: '4',
    category: 'Web Development',
    title: 'React Fundamentals',
    description: 'Components, props, state management, and the virtual DOM lifecycle.',
    priority: 'MEDIUM',
    timeMinutes: 90,
    date: 'Jul 20',
    dayName: 'Mon',
    completed: false,
  },
  {
    id: '5',
    category: 'Database Systems',
    title: 'SQL Queries & Joins',
    description: 'Complex joins, subqueries, aggregation functions, and indexing strategies.',
    priority: 'REVISION',
    timeMinutes: 75,
    date: 'Jul 21',
    dayName: 'Tue',
    completed: false,
  },
  {
    id: '6',
    category: 'Algorithms',
    title: 'Sorting Algorithms',
    description: 'Merge sort, quicksort, heapsort — time complexity and space trade-offs.',
    priority: 'EASY',
    timeMinutes: 60,
    date: 'Jul 22',
    dayName: 'Wed',
    completed: false,
  },
  {
    id: '7',
    category: 'Machine Learning',
    title: 'Neural Networks',
    description: 'Backpropagation, activation functions, and multi-layer perceptron design.',
    priority: 'URGENT',
    timeMinutes: 200,
    date: 'Jul 23',
    dayName: 'Thu',
    completed: false,
  },
  {
    id: '8',
    category: 'Software Development',
    title: 'Design Patterns',
    description: 'Singleton, Factory, Observer, and Strategy patterns with real-world examples.',
    priority: 'REVISION',
    timeMinutes: 110,
    date: 'Jul 24',
    dayName: 'Fri',
    completed: false,
  },
  {
    id: '9',
    category: 'Data Structures',
    title: 'Trees & Graphs',
    description: 'Binary search trees, AVL trees, BFS, DFS, and topological sorting.',
    priority: 'MEDIUM',
    timeMinutes: 130,
    date: 'Jul 25',
    dayName: 'Sat',
    completed: false,
  },
  {
    id: '10',
    category: 'Web Development',
    title: 'REST API Design',
    description: 'HTTP methods, status codes, authentication, and OpenAPI specification.',
    priority: 'EASY',
    timeMinutes: 85,
    date: 'Jul 26',
    dayName: 'Sun',
    completed: false,
  },
  {
    id: '11',
    category: 'Machine Learning',
    title: 'Model Evaluation',
    description: 'Cross-validation, confusion matrix, ROC-AUC, and precision-recall curves.',
    priority: 'REVISION',
    timeMinutes: 95,
    date: 'Jul 27',
    dayName: 'Mon',
    completed: false,
  },
  {
    id: '12',
    category: 'Algorithms',
    title: 'Dynamic Programming',
    description: 'Memoization, tabulation, Fibonacci, knapsack, and LCS problems.',
    priority: 'URGENT',
    timeMinutes: 180,
    date: 'Jul 28',
    dayName: 'Tue',
    completed: false,
  },
  {
    id: '13',
    category: 'Database Systems',
    title: 'Database Normalization',
    description: '1NF, 2NF, 3NF, BCNF — functional dependencies and decomposition.',
    priority: 'MEDIUM',
    timeMinutes: 100,
    date: 'Jul 29',
    dayName: 'Wed',
    completed: false,
  },
  {
    id: '14',
    category: 'Software Development',
    title: 'Git & Version Control',
    description: 'Branching strategies, merge conflicts, rebase workflows, and CI/CD.',
    priority: 'EASY',
    timeMinutes: 55,
    date: 'Jul 30',
    dayName: 'Thu',
    completed: false,
  },
  {
    id: '15',
    category: 'Machine Learning',
    title: 'Deep Learning Overview',
    description: 'CNNs, RNNs, transformers — architecture overview and use cases.',
    priority: 'REVISION',
    timeMinutes: 160,
    date: 'Jul 31',
    dayName: 'Fri',
    completed: false,
  },
]

export const studyAllocation: StudyDay[] = [
  { day: 'Day 1', minutes: 168 },
  { day: 'Day 2', minutes: 120 },
  { day: 'Day 3', minutes: 150 },
  { day: 'Day 4', minutes: 90 },
  { day: 'Day 5', minutes: 75 },
  { day: 'Day 6', minutes: 60 },
  { day: 'Day 7', minutes: 200 },
]

export const streakDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
// NOTE: completedStreakDays is no longer used — streak is computed
// dynamically from localStorage in Dashboard.tsx
