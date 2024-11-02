<script lang="ts">
    import type { PageData } from './$types';
    
    let { data }: { data: PageData } = $props();
</script>

<div class="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl p-8">
        <h2 class="text-center text-xl font-bold text-gray-700 mb-6">Other Page</h2>
        <div class="flex flex-col items-center">
            <img 
                class="h-24 w-24 rounded-full object-cover border-4 border-blue-500" 
                src={data.user.picture} 
                alt={data.user.name} 
                referrerpolicy="no-referrer"
            />
            
            <h1 class="mt-4 text-2xl font-bold text-gray-900">
                Hello again, {data.user.name}!
            </h1>
            
            <div class="mt-4 text-center">
                <p class="text-gray-600">
                    <span class="font-semibold">Email:</span> {data.user.email}
                </p>
            </div>

            <a 
                href="/loggedIn"
                class="mt-4 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
            >
                Back to Dashboard
            </a>
        </div>
    </div>
</div>
