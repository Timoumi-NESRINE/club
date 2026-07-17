import React from 'react'
import Image from 'next/image'
import * as LucideIcons from 'lucide-react'

export type IconName =
    | 'Home'
    | 'Users'
    | 'User'
    | 'Shield'
    | 'Lock'
    | 'Settings'
    | 'Trash'
    | 'Warning'
    | 'Menu'
    | 'Sparkles'
    | 'Palette'
    | 'Information'
    | 'Laptop'
    | 'Message'
    | 'Monitor'
    | 'Plus'
    | 'Globe'
    | 'Like'
    | 'NavbarExpand'
    | 'Language'
    | 'Search'
    | 'Mail'
    | 'Folder'
    | 'Calendar'

interface CustomIconProps {
    name: IconName
    className?: string
    iconType?: 'lucide' | 'custom'
    invert?: boolean
}

const iconMapping: Record<IconName, string> = {
    Home: 'Home_white cloud1.png',
    Users: 'Interface 1_white cloud1.png',
    User: 'Interface 1_white cloud1.png',
    Shield: 'Settings_white cloud1.png', // Using Settings for Shield as a fallback
    Lock: 'Settings_white cloud1.png',
    Settings: 'Settings_white cloud1.png',
    Trash: 'Trash Can_white cloud1.png',
    Warning: 'Warning_white cloud1.png',
    Menu: 'Menu_white cloud1.png',
    Sparkles: 'Play Circle_white cloud1.png',
    Palette: 'Web and CSS_white cloud1.png',
    Information: 'Information_white cloud.jpg',
    Laptop: 'Laptop_white cloud1.png',
    Message: 'Message_white cloud1.png',
    Monitor: 'Monitor_white cloud1.png',
    Plus: 'Link Add_white cloud1.png',
    Globe: 'Internet_white cloud1.png',
    Like: 'Like_white cloud1.png',
    NavbarExpand: 'Navbar Expand_white cloud1.png',
    Language: 'Language_white cloud1.png',
    Search: 'Findability_white cloud1.png',
    Mail: 'Message_white cloud1.png',
    Folder: '',
    Calendar: '',
}

export default function CustomIcon({ name, className = "w-5 h-5", iconType = 'lucide', invert = true }: CustomIconProps) {
    if (iconType === 'custom' && iconMapping[name]) {
        return (
            <div className={`relative ${className} flex items-center justify-center`}>
                <Image
                    src={`/Browse_all_icons/${iconMapping[name]}`}
                    alt={name}
                    width={24}
                    height={24}
                    className="object-contain"
                    style={invert ? { filter: 'brightness(0) invert(1)' } : { filter: 'brightness(0) opacity(0.7)' }}
                />
            </div>
        )
    }

    // Fallback to Lucide
    const LucideIcon = ((LucideIcons as unknown) as Record<string, React.ComponentType<{ className?: string }>>)[name] || LucideIcons.HelpCircle
    return <LucideIcon className={className} />
}
