import type React from 'react'
import type { BasicGridSelectOption } from '../components'

export interface DataRow extends Record<string, unknown> {
  employeeId: string
  firstName: string
  lastName: string
  name: string
  age: number
  role: string
  department: string
  position?: {
    name: string
  }
  salary: number
  city: string
  email: string
  team?: string
  contact: {
    email: string
    phone: string
  }
  address: {
    street1: string
    city: string
    state: string
    country: string
  }
  status: {
    name: string
    options: BasicGridSelectOption[]
  }
  progress: number
  actions?: string
}

export interface NetworkNode extends Record<string, unknown> {
  id: string
  name: string
  type: string
  status: string
  load: number
  latency: number
  items?: NetworkNode[]
}


