/**
 * Utility functions for marketplace
 */

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Tailwind class merging
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format satoshis to readable format
export function formatSats(sats: number): string {
  if (sats >= 1000000) {
    return `${(sats / 1000000).toFixed(2)}M`
  }
  if (sats >= 1000) {
    return `${(sats / 1000).toFixed(1)}K`
  }
  return sats.toString()
}

// Format price with currency
export function formatPrice(sats: number, currency: string = 'SATS'): string {
  if (currency === 'SATS') {
    return `${sats.toLocaleString()} sats`
  }
  return `${sats.toLocaleString()} ${currency}`
}

// Format distance from timestamp
export function formatDistanceToNow(date: string | Date): string {
  const now = new Date()
  const then = new Date(date)
  const diffMs = now.getTime() - then.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHour < 24) return `${diffHour}h ago`
  if (diffDay === 1) return 'yesterday'
  if (diffDay < 7) return `${diffDay}d ago`
  if (diffDay < 30) return `${Math.floor(diffDay / 7)}w ago`
  return `${Math.floor(diffDay / 30)}mo ago`
}

// Truncate text with ellipsis
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength - 3) + '...'
}

// Truncate npub for display
export function formatNpub(npub: string, chars: number = 8): string {
  if (!npub) return ''
  if (npub.length <= chars * 2 + 3) return npub
  return `${npub.slice(0, chars)}...${npub.slice(-chars)}`
}

// Validate npub format
export function isValidNpub(npub: string): boolean {
  return npub.startsWith('npub1') && npub.length === 63
}

// Generate shareable listing URL
export function getListingShareUrl(listingId: string, origin?: string): string {
  const base = origin || (typeof window !== 'undefined' ? window.location.origin : '')
  return `${base}/listing/${listingId}`
}

// Parse location string
export function parseLocation(location: string): { city?: string; region?: string } {
  const parts = location.split(',').map(p => p.trim())
  return {
    city: parts[0],
    region: parts[1],
  }
}

// Calculate reputation score
export function calculateReputation(
  successful: number,
  total: number,
  ratings: number[],
  weights = { completion: 0.4, rating: 0.6 }
): number {
  if (total === 0) return 0
  
  const completionRate = successful / total
  const avgRating = ratings.length > 0 
    ? ratings.reduce((a, b) => a + b, 0) / ratings.length 
    : 0
  
  return (
    completionRate * weights.completion * 5 +
    (avgRating / 5) * weights.rating * 5
  )
}

// Hash string to number for consistent avatar colors
export function stringToColor(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  const colors = [
    'from-red-400 to-orange-500',
    'from-orange-400 to-yellow-500',
    'from-yellow-400 to-green-500',
    'from-green-400 to-teal-500',
    'from-teal-400 to-blue-500',
    'from-blue-400 to-indigo-500',
    'from-indigo-400 to-purple-500',
    'from-purple-400 to-pink-500',
    'from-pink-400 to-rose-500',
  ]
  
  return colors[Math.abs(hash) % colors.length]
}

// Format file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Debounce function
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Deep clone
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

// Generate unique ID
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
}

// Categories
export const CATEGORIES = [
  { id: 'electronics', name: 'Electronics', icon: '💻' },
  { id: 'furniture', name: 'Furniture', icon: '🪑' },
  { id: 'vehicles', name: 'Vehicles', icon: '🚗' },
  { id: 'clothing', name: 'Clothing', icon: '👕' },
  { id: 'books', name: 'Books', icon: '📚' },
  { id: 'games', name: 'Games', icon: '🎮' },
  { id: 'sports', name: 'Sports', icon: '⚽' },
  { id: 'home', name: 'Home & Garden', icon: '🏠' },
  { id: 'art', name: 'Art & Collectibles', icon: '🎨' },
  { id: 'music', name: 'Music', icon: '🎵' },
  { id: 'tools', name: 'Tools', icon: '🔧' },
  { id: 'other', name: 'Other', icon: '📦' },
] as const

// Conditions
export const CONDITIONS = [
  { id: 'new', name: 'New', description: 'Never used, original packaging' },
  { id: 'like_new', name: 'Like New', description: 'Used once or twice, perfect condition' },
  { id: 'good', name: 'Good', description: 'Used, minor wear visible' },
  { id: 'fair', name: 'Fair', description: 'Used, noticeable wear' },
  { id: 'poor', name: 'Poor', description: 'Heavily used, needs work' },
] as const

// Payment status labels
export const PAYMENT_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'text-yellow-500' },
  paid: { label: 'Paid', color: 'text-blue-500' },
  shipped: { label: 'Shipped', color: 'text-purple-500' },
  delivered: { label: 'Delivered', color: 'text-green-500' },
  completed: { label: 'Completed', color: 'text-green-600' },
  cancelled: { label: 'Cancelled', color: 'text-red-500' },
  disputed: { label: 'Disputed', color: 'text-red-600' },
}
