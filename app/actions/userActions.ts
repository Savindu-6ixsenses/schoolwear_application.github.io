'use server';

import { createClient } from '@/utils/supabase/ssr_client/server';

/**
 * Checks if the current user has permission to create a store.
 * Allowed roles are 'admin' and 'supervisor'.
 * @returns {Promise<boolean>} - True if the user has permission, false otherwise.
 */
export async function checkUserCreatePermission(): Promise<boolean> {
	try {
		const supabase = await createClient();

		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			return false;
		}

		const { data: roleData, error } = await supabase
			.from('user_roles')
			.select('role')
			.eq('user_id', user.id)
			.single();

		if (error) {
			return false;
		}

		const allowedRoles = ['admin', 'supervisor'];
		return allowedRoles.includes(roleData.role);
	} catch (e) {
		console.error('Unexpected error in checkUserCreatePermission:', e);
		return false;
	}
}

export async function getUserRole(): Promise<string | null> {
	try {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			return null;
		}
		const { data: roleData, error } = await supabase
			.from('user_roles')
			.select('role')
			.eq('user_id', user.id)
			.single();

		if (error) {
			return null;
		}

		return roleData.role;
	} catch (e) {
		console.error('Unexpected error	 in getUserRole:', e);
		return null;
	}
}

