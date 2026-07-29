"use client";

import Link from "next/link";

import {

    LayoutDashboard,

    ClipboardList,

    Package,

    UtensilsCrossed,

    Tags,

    Users,

    ChartColumn,

    Settings

} from "lucide-react";

const menu = [

    {
        title: "Dashboard",
        href: "/admin/dashboard",
        icon: LayoutDashboard
    },

    {
        title: "Orders",
        href: "/admin/orders",
        icon: ClipboardList
    },

    {
        title: "Inventory",
        href: "/admin/inventory",
        icon: Package
    },

    {
        title: "Menu",
        href: "/admin/menu",
        icon: UtensilsCrossed
    },

    {
        title: "Categories",
        href: "/admin/categories",
        icon: Tags
    },

    {
        title: "Staff",
        href: "/admin/staff",
        icon: Users
    },

    {
        title: "Reports",
        href: "/admin/reports",
        icon: ChartColumn
    },

    {
        title: "Settings",
        href: "/admin/settings",
        icon: Settings
    }

];

export default function Sidebar() {

    return (

        <div className="w-72 bg-white border-r">

            <div className="text-3xl font-bold p-8">

                🔥 FIRE

            </div>

            <div className="flex flex-col gap-2 px-4">

                {

                    menu.map(item => {

                        const Icon = item.icon;

                        return (

                            <Link

                                key={item.title}

                                href={item.href}

                                className="flex items-center gap-3 rounded-lg p-3 hover:bg-orange-100 transition"

                            >

                                <Icon size={20} />

                                {item.title}

                            </Link>

                        )

                    })

                }

            </div>

        </div>

    )

}