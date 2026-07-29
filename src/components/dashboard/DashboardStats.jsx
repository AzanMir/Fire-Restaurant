import DashboardCard from "./DashboardCard";

export default function DashboardStats() {

    return (

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">

            <DashboardCard

                title="Today's Orders"

                value="28"

            />

            <DashboardCard

                title="Today's Sales"

                value="$640"

            />

            <DashboardCard

                title="Pending"

                value="5"

            />

            <DashboardCard

                title="Low Stock"

                value="7"

            />

        </div>

    )

}