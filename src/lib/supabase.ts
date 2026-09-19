import { createClient } from '@supabase/supabase-js';

const supabaseUrlEnv = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKeyEnv = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const supabasePublishableKeyEnv = import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY as string | undefined;
const supabaseKey = supabaseAnonKeyEnv?.trim() || supabasePublishableKeyEnv?.trim();
const disableBackendFlag = (import.meta.env.VITE_DISABLE_BACKEND as string | undefined)?.trim().toLowerCase();
const disableBackend = disableBackendFlag === 'true';

type QueryResult<T = any> = { data?: T; error?: { message: string } | null };

const createMockQueryBuilder = () => {
	const terminalResult = { data: [], error: null, count: 0 };
	const singleResult = { data: null, error: null };

	const target: Record<string, any> = {
		single: async (): Promise<QueryResult<any>> => singleResult,
		maybeSingle: async (): Promise<QueryResult<any>> => singleResult,
	};

	const builder: any = new Proxy(target, {
		get(obj, prop: string | symbol) {
			if (prop in obj) return obj[prop as keyof typeof obj];

			if (prop === 'then') {
				const promise = Promise.resolve(terminalResult);
				return promise.then.bind(promise);
			}

			return (..._args: any[]) => builder;
		},
	});

	return builder;
};

const mockSupabase = {
	from(_table: string) {
		return createMockQueryBuilder();
	},
	rpc(_fn: string, _params?: Record<string, any>) {
		return Promise.resolve({ data: null, error: null });
	},
	auth: {
		api: {
			sendVerificationEmail(_email: string) {
				return Promise.resolve({ error: null });
			},
		},
	},
	storage: {
		from(_bucket: string) {
			return {
				upload(_path: string, _file: File, _opts?: any): Promise<QueryResult<{ path: string }>> {
					return Promise.resolve({ data: { path: 'mock-path' }, error: null });
				},
				remove(_paths: string[]): Promise<QueryResult<string[]>> {
					return Promise.resolve({ data: [], error: null });
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
