export function TopIntro() {
	return (
		<div className="space-y-4">
			<div className="font-geist text-[48px] font-medium leading-tight tracking-[-0.2rem] flex flex-col text-primary-text">
				<span>Track Your</span>
				<span className="inline font-geist font-semibold text-[60px] animate-gradient bg-gradient-to-r from-brand-cool via-brand-soft to-brand-cool bg-clip-text text-transparent">
					Fitness Journey
				</span>
			</div>
			<p className="font-geist text-[12px] text-secondary-text leading-relaxed max-w-md">
				Connect your devices, log workouts, and monitor your progress all in one
				place. Start achieving your health goals today.
			</p>
		</div>
	);
}
