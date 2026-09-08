export const assetCategories=["Brand","Logo","Original Photos","Videos","Documents","Generated Images","Social","Blog Images","Reports"] as const;
export type AssetCategory=typeof assetCategories[number];
export function safeAssetName(name:string){const cleaned=name.normalize("NFKD").replace(/[^a-zA-Z0-9._-]+/g,"-").replace(/-+/g,"-").replace(/^-|-$/g,"");return cleaned.slice(-120)||"file"}
export function categoryForFile(file:{type:string}):AssetCategory{return file.type.startsWith("image/")?"Original Photos":file.type.startsWith("video/")?"Videos":"Documents"}
