export type Person = {
  id: number
  first_name: string
  last_name: string
}

// Supabase sometimes returns array, sometimes object
export function normalizePerson(input: any): Person | null {
  if (!input) return null

  if (Array.isArray(input)) {
    return input[0] || null
  }

  return input
}

// for tag relations
export function normalizeTagPerson(tag: any) {
  const person = normalizePerson(tag?.person)
  if (!person) return null

  return {
    person_id: tag.person_id,
    person
  }
}