export type AppRole="admin"|"staff"|"client";
export function homeForRole(role:AppRole){return role==="admin"?"/admin":role==="staff"?"/staff":"/client"}
export function canOpenPath(role:AppRole,path:string){if(path.startsWith("/admin"))return role==="admin";if(path.startsWith("/staff"))return role==="admin"||role==="staff";if(path.startsWith("/client"))return role==="client";return true}
