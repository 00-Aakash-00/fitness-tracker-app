import { Footer } from "@/components/layout/footer";
import { Sidebar } from "@/components/layout/sidebar";
import { TopNav } from "@/components/layout/top-nav";

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="flex min-h-screen">
			<Sidebar />
			<div className="flex flex-1 flex-col lg:ml-[72px] bg-secondary-surface">
				<TopNav />
				<main className="flex-1 p-4 md:p-6">
					{children}
				</main>
				<Footer />
			</div>
		</div>
	);
}
