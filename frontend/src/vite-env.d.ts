/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_API_BASE_URL?: string;
	readonly VITE_GOOGLE_CLIENT_ID?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}

interface GoogleCredentialResponse {
	credential?: string;
}

interface GoogleIdConfiguration {
	client_id: string;
	callback: (response: GoogleCredentialResponse) => void | Promise<void>;
}

interface GoogleAccountsId {
	initialize: (config: GoogleIdConfiguration) => void;
	renderButton: (
		parent: HTMLElement,
		options: {
			theme?: string;
			size?: string;
			text?: string;
			shape?: string;
			width?: number;
		},
	) => void;
	prompt: () => void;
}

interface Window {
	google?: {
		accounts: {
			id: GoogleAccountsId;
		};
	};
}
