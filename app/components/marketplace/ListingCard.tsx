'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ListingWithSeller } from '@/lib/drizzle/schema'
import { formatDistanceToNow } from '@/lib/utils'

interface ListingCardProps {
  listing: ListingWithSeller
  onClick?: (listing: ListingWithSeller) => void
  onBuy?: (listing: ListingWithSeller) => void
  onMessage?: (listing: ListingWithSeller) => void
}

const CATEGORY_ICONS: Record<string, string> = {
  electronics: '💻',
  furniture: '🪑',
  vehicles: '🚗',
  clothing: '👕',
  books: '📚',
  games: '🎮',
  sports: '⚽',
  home: '🏠',
  art: '🎨',
  music: '🎵',
  tools: '🔧',
  other: '📦',
}

const CONDITION_LABELS: Record<string, string> = {
  new: 'New',
  like_new: 'Like New',
  good: 'Good',
  fair: 'Fair',
  poor: 'Poor',
}

export function ListingCard({ listing, onClick, onBuy, onMessage }: ListingCardProps) {
  const [imageError, setImageError] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const icon = CATEGORY_ICONS[listing.category] || CATEGORY_ICONS.other
  const primaryImage = listing.images?.[0]
  const timeAgo = formatDistanceToNow(listing.timeCreated)

  return (
    <div
      className={`group relative bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden transition-all duration-200 ${
        isHovered ? 'shadow-lg scale-[1.02]' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onClick?.(listing)}
    >
      {/* Image Section */}
      <div className="relative h-48 bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
        {primaryImage && !imageError ? (
          <Image
            src={primaryImage}
            alt={listing.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setImageError(true)}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-6xl">
            {icon}
          </div>
        )}
        
        {/* Price Badge */}
        <div className="absolute top-2 right-2 bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold">
          {listing.priceSats.toLocaleString()} sats
        </div>

        {/* Status Badge */}
        {listing.status !== 'active' && (
          <div className="absolute top-2 left-2 bg-gray-500 text-white px-2 py-1 rounded text-xs uppercase">
            {listing.status}
          </div>
        )}

        {/* Escrow Badge */}
        {listing.escrowEnabled && (
          <div className="absolute bottom-2 right-2 bg-green-500/90 text-white px-2 py-0.5 rounded text-xs">
            🔒 Escrow
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 line-clamp-2 flex-1">
            {listing.title}
          </h3>
          <span className="text-xs text-neutral-500 dark:text-neutral-400 ml-2">
            {icon}
          </span>
        </div>

        <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2 mb-3">
          {listing.description}
        </p>

        <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-500 mb-3">
          {listing.condition && (
            <span className="bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded">
              {CONDITION_LABELS[listing.condition] || listing.condition}
            </span>
          )}
          {listing.location && (
            <span className="flex items-center gap-1">
              📍 {listing.location}
            </span>
          )}
        </div>

        {/* Seller Info */}
        <div className="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
              {listing.seller.npub?.slice(4, 6).toUpperCase() || '?'}
            </div>
            <div className="text-xs">
              <p className="font-medium text-neutral-700 dark:text-neutral-300">
                {listing.seller.nip05 || listing.seller.npub?.slice(0, 12) + '...'}
              </p>
              <p className="text-neutral-400">{timeAgo}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onMessage?.(listing)
              }}
              className="p-2 text-neutral-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              title="Message seller"
            >
              💬
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onBuy?.(listing)
              }}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Buy
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
