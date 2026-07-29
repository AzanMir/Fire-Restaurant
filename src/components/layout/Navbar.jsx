"use client";

import LogoutButton from "../common/LogoutButton";

export default function Navbar() {

    return (

        <header className="h-20 bg-white border-b flex items-center justify-between px-8">

            <div>

                <h2 className="text-2xl font-bold">

                    Restaurant Dashboard

                </h2>

            </div>

            <LogoutButton />

        </header>

    )

}