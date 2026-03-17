"use client";

import { Pause, Play, Trash2, Trophy, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
	deleteChallenge,
	updateChallengeStatus,
} from "@/app/dashboard/goals/actions";
import { Button } from "@/components/ui/button";
import type { ChallengeStatus } from "@/lib/goals/goals.types";

type ChallengeActionsProps = {
	challengeId: string;
	currentStatus: ChallengeStatus;
};

export function ChallengeActions({
	challengeId,
	currentStatus,
}: ChallengeActionsProps) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [error, setError] = useState<string | null>(null);

	function handleStatusChange(newStatus: ChallengeStatus) {
		setError(null);
		startTransition(async () => {
			const formData = new FormData();
			formData.set("challengeId", challengeId);
			formData.set("status", newStatus);
			const result = await updateChallengeStatus(formData);
			if (result.status === "success") {
				router.refresh();
				return;
			}

			setError(result.message);
		});
	}

	function handleDelete() {
		setError(null);
		startTransition(async () => {
			const formData = new FormData();
			formData.set("challengeId", challengeId);
			const result = await deleteChallenge(formData);
			if (result.status === "success") {
				router.push("/dashboard/goals");
				router.refresh();
				return;
			}

			setError(result.message);
		});
	}

	return (
		<div className="space-y-2">
			<div className="flex flex-wrap items-center gap-2">
				{/* Status transitions */}
				{currentStatus === "active" && (
					<>
						<Button
							variant="outline"
							size="sm"
							disabled={isPending}
							onClick={() => handleStatusChange("paused")}
						>
							<Pause className="h-4 w-4" />
							Pause
						</Button>
						<Button
							variant="outline"
							size="sm"
							disabled={isPending}
							onClick={() => handleStatusChange("completed")}
						>
							<Trophy className="h-4 w-4" />
							Complete
						</Button>
						<Button
							variant="outline"
							size="sm"
							disabled={isPending}
							onClick={() => handleStatusChange("abandoned")}
						>
							<XCircle className="h-4 w-4" />
							Abandon
						</Button>
					</>
				)}
				{currentStatus === "paused" && (
					<>
						<Button
							variant="outline"
							size="sm"
							disabled={isPending}
							onClick={() => handleStatusChange("active")}
						>
							<Play className="h-4 w-4" />
							Resume
						</Button>
						<Button
							variant="outline"
							size="sm"
							disabled={isPending}
							onClick={() => handleStatusChange("abandoned")}
						>
							<XCircle className="h-4 w-4" />
							Abandon
						</Button>
					</>
				)}
				{(currentStatus === "completed" || currentStatus === "abandoned") && (
					<Button
						variant="outline"
						size="sm"
						disabled={isPending}
						onClick={() => handleStatusChange("active")}
					>
						<Play className="h-4 w-4" />
						Restart
					</Button>
				)}

				{/* Delete */}
				{showDeleteConfirm ? (
					<div className="flex items-center gap-2">
						<span className="font-secondary text-xs text-secondary-text">
							Delete permanently?
						</span>
						<Button
							variant="destructive"
							size="sm"
							disabled={isPending}
							onClick={handleDelete}
						>
							{isPending ? "Deleting..." : "Confirm"}
						</Button>
						<Button
							variant="ghost"
							size="sm"
							disabled={isPending}
							onClick={() => setShowDeleteConfirm(false)}
						>
							Cancel
						</Button>
					</div>
				) : (
					<Button
						variant="ghost"
						size="sm"
						disabled={isPending}
						onClick={() => setShowDeleteConfirm(true)}
					>
						<Trash2 className="h-4 w-4 text-red-500" />
					</Button>
				)}
			</div>
			{error ? <p className="text-sm text-red-500">{error}</p> : null}
		</div>
	);
}
