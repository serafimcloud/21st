export interface ResendContact {
  id: string
  email: string
  first_name?: string
  last_name?: string
  created_at: string
  unsubscribed: boolean
}

export interface ListContactsOptions {
  audienceId: string
}

export interface ListContactsResponse {
  data: ResendContact[]
}
