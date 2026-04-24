import axios from 'axios'
import toast from 'react-hot-toast'

const client = axios.create({
  baseURL: 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
})

client.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'Error de red'
    toast.error(message)
    return Promise.reject(error)
  }
)

export default client
