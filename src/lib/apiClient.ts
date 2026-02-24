const API_URL = 'http://localhost:3001/api';

class ApiClient {
    private tableName: string = '';
    private queryParams: Record<string, string> = {};
    private method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET';
    private body: any = null;
    private isSingle: boolean = false;

    from(table: string) {
        const newClient = new ApiClient();
        newClient.tableName = table;
        return newClient;
    }

    select(query: string = '*') {
        if (this.method === 'GET') {
            this.method = 'GET';
        }
        return this;
    }

    insert(data: any | any[]) {
        this.method = 'POST';
        this.body = data;
        return this;
    }

    update(data: any) {
        this.method = 'PATCH';
        this.body = data;
        return this;
    }

    eq(column: string, value: string) {
        this.queryParams[column] = value;
        return this;
    }

    order(column: string, { ascending = true } = {}) {
        return this;
    }

    single() {
        this.isSingle = true;
        return this;
    }

    async then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) {
        try {
            const url = new URL(`${API_URL}/${this.tableName}`);
            Object.entries(this.queryParams).forEach(([key, val]) => {
                url.searchParams.append(key, val);
            });

            const response = await fetch(url.toString(), {
                method: this.method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: (this.method === 'POST' || this.method === 'PATCH') ? JSON.stringify(this.body) : null,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const result = { data: null, error: { message: errorData.error?.message || response.statusText } };
                return onfulfilled ? onfulfilled(result) : result;
            }

            const result = await response.json();

            if (this.isSingle && Array.isArray(result.data)) {
                result.data = result.data[0] || null;
            }

            return onfulfilled ? onfulfilled(result) : result;
        } catch (error: any) {
            const result = { data: null, error: { message: error.message } };
            return onfulfilled ? onfulfilled(result) : result;
        }
    }
}

export const supabase = new ApiClient() as any;
