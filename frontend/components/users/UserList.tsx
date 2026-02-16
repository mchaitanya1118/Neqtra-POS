import { User } from "@/store/useUserStore";
import { UserCard } from "./UserCard";
import { AnimatePresence, motion } from "framer-motion";
import { Box } from "lucide-react";

interface UserListProps {
    users: User[];
    onEdit: (user: User) => void;
    onDelete: (id: number) => void;
}

export function UserList({ users, onEdit, onDelete }: UserListProps) {
    if (users.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-surface border border-surface-light p-16 rounded-[40px] text-center"
            >
                <Box className="w-16 h-16 text-muted/20 mx-auto mb-4" />
                <p className="text-muted font-bold text-lg">No users found.</p>
                <p className="text-sm text-muted/60 mt-1">Try adjusting your search or add a new staff member.</p>
            </motion.div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence mode="popLayout">
                {users.map((user) => (
                    <UserCard
                        key={user.id}
                        user={user}
                        onEdit={onEdit}
                        onDelete={onDelete}
                    />
                ))}
            </AnimatePresence>
        </div>
    );
}
