"use client";

import { useEffect, useState, useMemo } from "react";
import { Plus, Users, Shield, Search, Download, Trash2, Box } from "lucide-react";
import { useUserStore, User, Role } from "@/store/useUserStore";
import { UserList } from "@/components/users/UserList";
import { UserModal } from "@/components/users/UserModal";
import { RoleList } from "@/components/users/RoleList";
import { RoleModal } from "@/components/users/RoleModal";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function UsersPage() {
    const {
        users, roles, isLoading, error,
        fetchUsers, fetchRoles, deleteUser
    } = useUserStore();

    const [activeTab, setActiveTab] = useState<'users' | 'roles'>('users');
    const [search, setSearch] = useState("");

    // Modal States
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);

    useEffect(() => {
        fetchUsers();
        fetchRoles();
    }, [fetchUsers, fetchRoles]);

    const filteredUsers = useMemo(() =>
        users.filter(u =>
            u.name.toLowerCase().includes(search.toLowerCase()) ||
            u.username?.toLowerCase().includes(search.toLowerCase()) ||
            u.roleRel?.name.toLowerCase().includes(search.toLowerCase()) ||
            u.role.toLowerCase().includes(search.toLowerCase())
        ).sort((a, b) => a.name.localeCompare(b.name))
        , [users, search]);

    // User Handlers
    const handleCreateUser = () => {
        setEditingUser(null);
        setIsUserModalOpen(true);
    };

    const handleEditUser = (user: User) => {
        setEditingUser(user);
        setIsUserModalOpen(true);
    };

    const handleDeleteUser = async (id: number) => {
        if (confirm("Are you sure you want to delete this user?")) {
            await deleteUser(id);
        }
    };

    // Role Handlers
    const handleCreateRole = () => {
        setEditingRole(null);
        setIsRoleModalOpen(true);
    };

    const handleEditRole = (role: Role) => {
        setEditingRole(role);
        setIsRoleModalOpen(true);
    };

    const handleExport = () => {
        const data = activeTab === 'users' ? filteredUsers : roles;
        const csv = activeTab === 'users'
            ? ["Name,Username,Role", ...filteredUsers.map(u => `${u.name},${u.username},${u.roleRel?.name || u.role}`)].join("\n")
            : ["Role Name,Permissions", ...roles.map(r => `${r.name},"${r.permissions.join(", ")}"`)].join("\n");

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${activeTab}_export_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 min-h-screen relative">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight font-serif italic dark:text-white">Staff & Roles</h1>
                    <p className="text-sm text-muted mt-2">Manage team access, permissions, and security profiles.</p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <div className="bg-surface border border-surface-light px-5 py-2.5 rounded-2xl flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                            {users.length}
                        </div>
                        <div>
                            <p className="text-[10px] uppercase font-bold text-muted tracking-wider">Total Staff</p>
                            <p className="text-sm font-bold text-foreground">Active Members</p>
                        </div>
                    </div>

                    <button
                        onClick={handleExport}
                        className="bg-surface border border-surface-light text-foreground p-3 rounded-full hover:bg-surface-light transition-all shadow-sm group"
                        title="Export CSV"
                    >
                        <Download className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    </button>

                    <button
                        onClick={activeTab === 'users' ? handleCreateUser : handleCreateRole}
                        className="bg-primary hover:bg-primary/90 text-black px-6 py-3 rounded-full text-sm font-bold shadow-lg shadow-primary/25 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" /> {activeTab === 'users' ? "Add Member" : "Add Role"}
                    </button>
                </div>
            </div>

            {/* Controls Bar */}
            <div className="flex flex-col xl:flex-row gap-6">
                {/* Tabs with Slider */}
                <div className="flex bg-surface border border-surface-light p-1 rounded-2xl relative w-full xl:w-fit self-start">
                    <button
                        onClick={() => setActiveTab('users')}
                        className={cn(
                            "relative z-10 px-8 py-2.5 text-sm font-bold transition-all rounded-xl flex items-center gap-2",
                            activeTab === 'users' ? "text-black" : "text-muted hover:text-foreground"
                        )}
                    >
                        <Users className="w-4 h-4" /> Users
                    </button>
                    <button
                        onClick={() => setActiveTab('roles')}
                        className={cn(
                            "relative z-10 px-8 py-2.5 text-sm font-bold transition-all rounded-xl flex items-center gap-2",
                            activeTab === 'roles' ? "text-black" : "text-muted hover:text-foreground"
                        )}
                    >
                        <Shield className="w-4 h-4" /> Roles
                    </button>
                    <motion.div
                        layoutId="activeTab"
                        className="absolute inset-y-1 bg-primary rounded-xl shadow-md"
                        initial={false}
                        animate={{
                            left: activeTab === 'users' ? 4 : 'auto',
                            right: activeTab === 'roles' ? 4 : 'auto',
                            width: 'calc(50% - 4px)'
                        }}
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                </div>

                {/* Search (only for users) */}
                {activeTab === 'users' && (
                    <div className="flex items-center gap-3 bg-surface border border-surface-light px-5 py-3 rounded-2xl flex-1 focus-within:ring-2 ring-primary/20 transition-all group">
                        <Search className="w-5 h-5 text-muted group-focus-within:text-primary transition-colors" />
                        <input
                            className="bg-transparent text-sm focus:outline-none w-full placeholder:text-muted/50 dark:text-white"
                            placeholder="Search names, usernames, or roles..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                )}
            </div>

            {/* Main Content Area */}
            <div className="relative min-h-[400px]">
                {error && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mb-8 p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl text-sm font-medium flex items-center justify-between"
                    >
                        <p>{error}</p>
                        <button onClick={() => window.location.reload()} className="underline font-bold">Retry</button>
                    </motion.div>
                )}

                <AnimatePresence mode="wait">
                    {isLoading && (users.length === 0 && roles.length === 0) ? (
                        <motion.div
                            key="loader"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center py-20 gap-4"
                        >
                            <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                            <p className="text-muted font-bold animate-pulse uppercase tracking-[0.2em] text-xs">Loading records...</p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            {activeTab === 'users' ? (
                                <UserList
                                    users={filteredUsers}
                                    onEdit={handleEditUser}
                                    onDelete={handleDeleteUser}
                                />
                            ) : (
                                <RoleList
                                    onEdit={handleEditRole}
                                />
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Modals */}
            <UserModal
                isOpen={isUserModalOpen}
                onClose={() => setIsUserModalOpen(false)}
                user={editingUser || undefined}
            />

            <RoleModal
                isOpen={isRoleModalOpen}
                onClose={() => setIsRoleModalOpen(false)}
                role={editingRole || undefined}
            />
        </div>
    );
}
