import { createClient } from '@supabase/supabase-js';

const supabaseUrlEnv = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKeyEnv = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const supabasePublishableKeyEnv = import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY as string | undefined;
const supabaseKey = supabaseAnonKeyEnv?.trim() || supabasePublishableKeyEnv?.trim();
const disableBackendFlag = (import.meta.env.VITE_DISABLE_BACKEND as string | undefined)?.trim().toLowerCase();
const disableBackend = disableBackendFlag === 'true';

type QueryResult<T = any> = { data?: T; error?: { message: string } | null };

const mockSupabase = {
	from(_table: string) {
		return {
			select(_columns?: string) {
				return {
					eq(_col: string, _val: any) {
						return {
							single(): QueryResult<any> {
								return { data: null, error: null };
							},
							maybeSingle(): QueryResult<any> {
								return { data: null, error: null };
							},
						};
					},
				} as any;
			},
			insert(_rows: any[]) {
				const builder = {
					select(): QueryResult<any[]> {
						return { data: [{ id: 'mock-id' }], error: null };
					},
				};
				return builder as any;
			},
			update(_values: Record<string, any>) {
				return {
					eq(_col: string, _val: any): QueryResult<void> {
						return { error: null };
					},
				} as any;
			},
		} as any;
	},
	storage: {
		from(_bucket: string) {
			return {
				upload(_path: string, _file: File, _opts?: any): QueryResult<{ path: string }> {
					return { data: { path: 'mock-path' }, error: null };
				},
				getPublicUrl(path: string) {
					return { data: { publicUrl: `https://example.com/${path}` } };
				},
			} as any;
		},
	},
} as any;

let supabase: any;

if (disableBackend || !supabaseUrlEnv?.trim() || !supabaseKey) {
	const reason = disableBackend
		? 'VITE_DISABLE_BACKEND=true'
		: 'missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY/VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY';
	console.warn(`Backend disabled: using mock Supabase client (${reason}).`);
	supabase = mockSupabase;
} else {
	supabase = createClient(supabaseUrlEnv, supabaseKey);
}

export { supabase };
