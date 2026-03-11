'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Bed, Heart } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { useFavorites } from '@/lib/hooks'

export function RoomCard({ room, userId, index = 0 }: { room: any; userId?: string; index?: number }) {
  const { favorites, toggleFavorite } = useFavorites(userId)
  const isFav = favorites.includes(room.id)
  const img = room.room_images?.find((i: any) => i.is_primary) || room.room_images?.[0]

  return (
    <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:index*0.05,duration:0.3}} className="card-hover">
      <div className="rounded-3xl overflow-hidden bg-white border border-black/6 shadow-sm h-full flex flex-col">
        {/* Image */}
        <div className="relative h-48 bg-gray-100 shrink-0">
          {img ? (
            <Image src={img.url} alt={room.title} fill className="object-cover"/>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
              <span className="text-5xl">🏠</span>
            </div>
          )}
          {/* Availability badge */}
          <div className="absolute top-3 left-3">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${room.is_available ? 'bg-green-500 text-white' : 'bg-amber-500 text-white'}`}>
              {room.is_available ? '● Available' : '○ Occupied'}
            </span>
          </div>
          {/* Heart */}
          {userId && (
            <button onClick={e => { e.preventDefault(); toggleFavorite(room.id) }}
              className={`absolute top-3 right-3 w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center transition-all hover:scale-110 ${isFav ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}>
              <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`}/>
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-1">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <h3 className="font-display font-medium text-gray-900 text-sm leading-snug line-clamp-2 flex-1">{room.title}</h3>
            <div className="shrink-0 text-right">
              <div className="font-semibold text-primary text-sm">{formatPrice(room.rent_price)}</div>
              <div className="text-muted-foreground text-xs">/mo</div>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
            <MapPin className="w-3 h-3 text-primary shrink-0"/>
            <span className="line-clamp-1">{room.location}, {room.city}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
            <span className="flex items-center gap-1"><Bed className="w-3.5 h-3.5"/> {room.num_beds} Bed{room.num_beds > 1 ? 's' : ''}</span>
            <span className="w-1 h-1 rounded-full bg-gray-200"/>
            <span>{room.room_type}</span>
          </div>
          {room.amenities?.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {room.amenities.slice(0,3).map((a: string) => (
                <span key={a} className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-500">{a}</span>
              ))}
              {room.amenities.length > 3 && <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-500">+{room.amenities.length - 3}</span>}
            </div>
          )}
          <div className="mt-auto">
            <Link href={`/room/${room.id}`}>
              <button className="w-full py-2.5 rounded-2xl bg-primary text-white text-sm font-semibold hover:bg-red-600 transition-colors">
                View Details
              </button>
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export function RoomCardSkeleton() {
  return (
    <div className="rounded-3xl overflow-hidden border border-black/6 bg-white shadow-sm">
      <div className="h-48 bg-gray-100 shimmer"/>
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-100 rounded-full shimmer w-3/4"/>
        <div className="h-3 bg-gray-100 rounded-full shimmer w-1/2"/>
        <div className="flex gap-2">
          <div className="h-5 w-16 bg-gray-100 rounded-full shimmer"/>
          <div className="h-5 w-20 bg-gray-100 rounded-full shimmer"/>
        </div>
        <div className="h-9 bg-gray-100 rounded-2xl shimmer"/>
      </div>
    </div>
  )
}
