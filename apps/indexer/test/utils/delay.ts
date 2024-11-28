export async function delay(ms: number) {
    const promise = new Promise( resolve => setTimeout(resolve, ms) );
    return await promise;
}