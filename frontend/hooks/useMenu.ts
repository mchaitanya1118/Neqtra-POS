import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api";
import { useMenuStore } from "@/store/useMenuStore";
import { useEffect } from "react";
import { db } from "@/lib/db";

export function useMenu() {
    const { setCategories } = useMenuStore.getState() as any;

    const query = useQuery({
        queryKey: ["menu"],
        queryFn: async () => {
            const res = await apiClient.get("/menu/categories");
            const data = res.data;
            const mapped = data.map((c: any) => ({
                ...c,
                icon: c.icon || "Coffee",
                variant: c.variant || "mint",
                items: c.items || [],
            }));

            // Update Dexie cache
            await db.cache.put({
                key: "menu_categories",
                data: mapped,
                updatedAt: Date.now(),
            });

            return mapped;
        },
        staleTime: 5 * 60 * 1000,
    });

    // Keep Zustand store in sync with React Query for components still using Zustand
    useEffect(() => {
        if (query.data) {
            useMenuStore.setState({ categories: query.data, isLoading: false });
        }
    }, [query.data, setCategories]);

    return query;
}
