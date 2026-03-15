
"use client";

import * as React from "react";
import { useState, useEffect, useActionState, useMemo, startTransition, useRef } from "react";
import Image from "next/image";
import { MoreHorizontal, PlusCircle, Search, ImageIcon, X, Star, Loader2, Upload, Trash2, Plus } from "lucide-react";
import { z } from "zod";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import type { Product, Review, ProductVariant } from "@/lib/types";
import imageCompression from 'browser-image-compression';


import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/page-header";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { addProductAction, updateProductAction, deleteProductAction, updateProductWebsiteStatus, uploadProductImageAction, removeAllProductImagesAction } from "./actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";

const reviewSchema = z.object({
    name: z.string(),
    rating: z.number(),
    title: z.string(),
    review: z.string(),
    image: z.string().optional(),
    createdAt: z.string().datetime(),
});

const variantSchema = z.object({
    size: z.string().min(1, "Size is required"),
    price: z.coerce.number().min(0, "Price must be a positive number"),
    mrp: z.coerce.number().min(0, "MRP must be a positive number").optional(),
    quantity: z.coerce.number().int().min(0, "Quantity must be a positive integer"),
    sku: z.string().min(1, "SKU is required"),
});

const productSchema = z.object({
  sku: z.string().min(1, "SKU is required"),
  name: z.string().min(1, "Name is required"),
  brand: z.string().min(1, "Brand is required"),
  description: z.string().optional(),
  category: z.enum(["ethnicWear", "bedsheet"]),
  subCategory: z.string().optional(),
  colors: z.string().min(1, "Please enter at least one color"),
  sizes: z.string().min(1, "Please enter at least one size"),
  price: z.coerce.number().min(0, "Price must be a positive number"),
  mrp: z.coerce.number().min(0, "MRP must be a positive number").optional(),
  quantity: z.coerce.number().int().min(0, "Quantity must be a positive integer"),
  onWebsite: z.boolean().default(true),
  hasVariants: z.boolean().default(false),
  variants: z.array(variantSchema).optional(),
  reviews: z.array(reviewSchema).optional(),
}).refine(data => {
    if (data.category === 'ethnicWear' && data.subCategory) {
        return ["Sarees", "Kurtis & tops", "Cord-Set", "Readymade Suit", "Unstitched Material"].includes(data.subCategory);
    }
    if (data.category === 'bedsheet' && data.subCategory) {
        return ["Pure Cotton", "Cotton Blend", "Fitted"].includes(data.subCategory);
    }
    return true;
}, {
    message: "Sub-category is not valid for the selected category",
    path: ["subCategory"],
});

const subCategoryOptions = {
    ethnicWear: ["Sarees", "Kurtis & tops", "Cord-Set", "Readymade Suit", "Unstitched Material"],
    bedsheet: ["Pure Cotton", "Cotton Blend", "Fitted"],
};


function ProductForm({ product, onProductUpdate, formKey: key }: { product?: Product | null; onProductUpdate: (updatedProduct: Product) => void; formKey?: number }) {
  const { toast } = useToast();
  const isEditMode = !!product;

  const form = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    key: key?.toString(), // Use key to force re-render
    defaultValues: product ? {
      ...product,
      description: product.desc,
      colors: product.colors?.join(', ') || '',
      sizes: product.sizes?.join(', ') || '',
      onWebsite: product.onWebsite,
      hasVariants: product.hasVariants || false,
      variants: product.variants || [],
    } : {
      sku: "",
      name: "",
      brand: "KKOSH",
      description: "",
      category: "ethnicWear",
      subCategory: "Sarees",
      colors: "",
      sizes: "",
      price: 0,
      mrp: 0,
      quantity: 0,
      onWebsite: true,
      hasVariants: false,
      variants: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "variants",
  });

  const selectedCategory = form.watch("category");
  const hasVariants = form.watch("hasVariants");
  const variants = form.watch("variants") || [];

  // Local state for image previews and files
  const [imagePreviews, setImagePreviews] = useState<(string | null)[]>([]);
  const [imageFiles, setImageFiles] = useState<(File | null)[]>(Array(4).fill(null));
  const [uploading, setUploading] = useState<boolean[]>(Array(4).fill(false));
  const [totalImageSize, setTotalImageSize] = useState(0);
  const MAX_TOTAL_SIZE = 1024 * 1024; // 1MB

  useEffect(() => {
    const existingImages = product?.images || [];
    const previews = [...existingImages];
    while (previews.length < 4) {
      previews.push(null);
    }
    setImagePreviews(previews);
    setImageFiles(Array(4).fill(null));
    setTotalImageSize(0);
  }, [product]);

  useEffect(() => {
    if (selectedCategory) {
        form.setValue("subCategory", subCategoryOptions[selectedCategory][0]);
    }
  }, [selectedCategory, form]);

  // If variants are enabled, update top-level price and quantity
  useEffect(() => {
    if (hasVariants && variants.length > 0) {
        const totalQty = variants.reduce((sum, v) => sum + (v.quantity || 0), 0);
        const minPrice = Math.min(...variants.map(v => v.price || 0));
        form.setValue("quantity", totalQty);
        form.setValue("price", minPrice);
    }
  }, [hasVariants, variants, form]);
  
  const updateTotalSize = (files: (File | null)[]) => {
      const total = files.reduce((acc, file) => acc + (file ? file.size : 0), 0);
      setTotalImageSize(total);
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (file) {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      };
      try {
        const compressedFileAsBlob = await imageCompression(file, options);
        const compressedFile = new File([compressedFileAsBlob], file.name, {
            type: compressedFileAsBlob.type,
            lastModified: Date.now(),
        });

        const newImageFiles = [...imageFiles];
        newImageFiles[index] = compressedFile;
        
        const currentTotal = newImageFiles.reduce((acc, f) => acc + (f ? f.size : 0), 0);
        
        if (currentTotal > MAX_TOTAL_SIZE && !isEditMode) {
          toast({
            variant: "destructive",
            title: "Image Size Limit Exceeded",
            description: "Total combined image size cannot exceed 1MB.",
          });
          return;
        }

        setImageFiles(newImageFiles);
        if (!isEditMode) {
            updateTotalSize(newImageFiles);
        }

        const newPreviews = [...imagePreviews];
        if (newPreviews[index]?.startsWith("blob:")) {
            URL.revokeObjectURL(newPreviews[index]!);
        }
        newPreviews[index] = URL.createObjectURL(compressedFile);
        setImagePreviews(newPreviews);
        
      } catch (error) {
        console.error('Image compression error:', error);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to compress image.' });
      }
    }
  };
  
  const handleRemoveImage = (index: number) => {
      const newImageFiles = [...imageFiles];
      newImageFiles[index] = null;
      setImageFiles(newImageFiles);

      const newPreviews = [...imagePreviews];
      if (newPreviews[index]?.startsWith("blob:")) {
          URL.revokeObjectURL(newPreviews[index]!);
      }
      newPreviews[index] = null;
      setImagePreviews(newPreviews);
      
      if (!isEditMode) {
          updateTotalSize(newImageFiles);
      }
  };


  const handleImageUpload = async (index: number) => {
    const file = imageFiles[index];
    if (!file || !product?.id) {
        toast({ variant: 'destructive', title: 'Error', description: 'No file selected or product not saved yet.' });
        return;
    }

    setUploading(prev => {
        const newUploading = [...prev];
        newUploading[index] = true;
        return newUploading;
    });

    const formData = new FormData();
    formData.append('image', file);

    const result = await uploadProductImageAction(product.id, formData);

    setUploading(prev => {
        const newUploading = [...prev];
        newUploading[index] = false;
        return newUploading;
    });

    if (result.success && result.images) {
        toast({ title: 'Success', description: 'Image uploaded successfully.' });
        const updatedProduct = { ...product, images: result.images };
        onProductUpdate(updatedProduct);
        
        // Clear the file from state after successful upload
        const newImageFiles = [...imageFiles];
        newImageFiles[index] = null;
        setImageFiles(newImageFiles);

    } else {
        toast({ variant: 'destructive', title: 'Upload Failed', description: result.message });
    }
  };
  
  const handleRemoveAllImages = async () => {
    if (!product?.id) return;
    const result = await removeAllProductImagesAction(product.id);
    if (result.success) {
      toast({ title: "Images Removed", description: result.message });
      const updatedProduct = { ...product, images: [] };
      onProductUpdate(updatedProduct);
    } else {
      toast({ variant: "destructive", title: "Error", description: result.message });
    }
  };

  return (
    <>
        <div className="grid gap-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                <Label htmlFor="sku">Parent SKU</Label>
                <Input id="sku" {...form.register("sku")} name="sku" />
                {form.formState.errors.sku && <p className="text-sm text-destructive">{form.formState.errors.sku.message as string}</p>}
                </div>
                <div className="space-y-2">
                <Label htmlFor="name">Product Name</Label>
                <Input id="name" {...form.register("name")} name="name" />
                {form.formState.errors.name && <p className="text-sm text-destructive">{form.formState.errors.name.message as string}</p>}
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="brand">Brand</Label>
                <Input id="brand" {...form.register("brand")} name="brand" />
                {form.formState.errors.brand && <p className="text-sm text-destructive">{form.formState.errors.brand.message as string}</p>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" {...form.register("description")} name="description" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Controller
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value} name="category">
                        <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ethnicWear">Ethnic Wear</SelectItem>
                            <SelectItem value="bedsheet">Bedsheet</SelectItem>
                        </SelectContent>
                        </Select>
                    )}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="subCategory">Sub-category</Label>
                    <Controller
                        control={form.control}
                        name="subCategory"
                        render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value} name="subCategory">
                            <SelectTrigger>
                                <SelectValue placeholder="Select a sub-category" />
                            </SelectTrigger>
                            <SelectContent>
                                {selectedCategory && subCategoryOptions[selectedCategory].map(sub => (
                                    <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                                ))}
                            </SelectContent>
                            </Select>
                        )}
                    />
                    {form.formState.errors.subCategory && <p className="text-sm text-destructive">{form.formState.errors.subCategory.message as string}</p>}
                </div>
            </div>

            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label>Product Images</Label>
                    {isEditMode && product?.images && product.images.length > 0 && (
                        <Button type="button" variant="destructive" size="sm" onClick={handleRemoveAllImages} disabled={!product?.id}>
                            Remove All Images
                        </Button>
                    )}
                </div>
                {!isEditMode && (
                    <div className="space-y-2 pt-1">
                        <p className="text-sm text-muted-foreground">Combined size should not exceed 1MB</p>
                        <Progress value={(totalImageSize / MAX_TOTAL_SIZE) * 100} className="h-2" />
                        <p className="text-xs text-muted-foreground text-right">
                            {(totalImageSize / 1024).toFixed(2)} KB / 1024 KB
                        </p>
                    </div>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[...Array(4)].map((_, index) => (
                    <div key={index} className="space-y-2">
                        <div className="relative aspect-square border-2 border-dashed rounded-md flex items-center justify-center">
                            {imagePreviews[index] ? (
                                <>
                                    <Image
                                        src={imagePreviews[index]!}
                                        alt={`Preview ${index + 1}`}
                                        layout="fill"
                                        objectFit="cover"
                                        className="rounded-md"
                                    />
                                    <Button
                                      type="button"
                                      variant="destructive"
                                      size="icon"
                                      className="absolute top-1 right-1 h-6 w-6 z-10"
                                      onClick={() => handleRemoveImage(index)}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                </>
                            ) : (
                                <Label htmlFor={`image-upload-${index}`} className="cursor-pointer flex flex-col items-center gap-1 text-center">
                                <ImageIcon className="h-6 w-6 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">Image {index + 1}</span>
                                </Label>
                            )}
                             <Input 
                                id={`image-upload-${index}`} 
                                name="images"
                                type="file" 
                                accept="image/*"
                                className="sr-only" 
                                onChange={(e) => handleImageChange(e, index)}
                            />
                        </div>
                        {isEditMode && (
                          <Button
                              type="button"
                              size="sm"
                              className="w-full"
                              onClick={() => handleImageUpload(index)}
                              disabled={!imageFiles[index] || uploading[index] || !product?.id}
                          >
                              {uploading[index] ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                  <Upload className="h-4 w-4 mr-2" />
                              )}
                              Upload
                          </Button>
                        )}
                    </div>
                ))}
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                <Label htmlFor="colors">Colors</Label>
                <Input id="colors" placeholder="e.g. Red, Blue, Green" {...form.register("colors")} name="colors" />
                {form.formState.errors.colors && <p className="text-sm text-destructive">{form.formState.errors.colors.message as string}</p>}
                </div>
                <div className="space-y-2">
                <Label htmlFor="sizes">Available Sizes (Comma separated)</Label>
                <Input id="sizes" placeholder="e.g. S, M, L" {...form.register("sizes")} name="sizes" />
                {form.formState.errors.sizes && <p className="text-sm text-destructive">{form.formState.errors.sizes.message as string}</p>}
                </div>
            </div>

            <Separator />

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <Label>Size-based Pricing & Stock</Label>
                        <p className="text-sm text-muted-foreground">Enable to set different prices and quantity for each size.</p>
                    </div>
                    <Controller
                        control={form.control}
                        name="hasVariants"
                        render={({ field }) => (
                            <>
                                <input type="hidden" name="hasVariants" value={field.value ? "on" : "off"} />
                                <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            </>
                        )}
                    />
                </div>

                {hasVariants && (
                    <div className="space-y-4 border p-4 rounded-lg bg-muted/50">
                        <div className="grid grid-cols-[1fr_2fr_1.5fr_1.5fr_1fr_40px] gap-2 items-center text-xs font-semibold px-2">
                            <span>Size</span>
                            <span>SKU</span>
                            <span>Price (₹)</span>
                            <span>MRP (₹)</span>
                            <span>Qty</span>
                            <span></span>
                        </div>
                        {fields.map((field, index) => (
                            <div key={field.id} className="grid grid-cols-[1fr_2fr_1.5fr_1.5fr_1fr_40px] gap-2 items-start">
                                <Input size={1} {...form.register(`variants.${index}.size` as const)} placeholder="Size" />
                                <Input size={1} {...form.register(`variants.${index}.sku` as const)} placeholder="SKU" />
                                <Input size={1} type="number" {...form.register(`variants.${index}.price` as const)} placeholder="Price" />
                                <Input size={1} type="number" {...form.register(`variants.${index}.mrp` as const)} placeholder="MRP" />
                                <Input size={1} type="number" {...form.register(`variants.${index}.quantity` as const)} placeholder="Qty" />
                                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="h-10 w-10 text-destructive">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => append({ size: "", sku: "", price: 0, mrp: 0, quantity: 0 })}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Variant
                        </Button>
                        <input type="hidden" name="variantsData" value={JSON.stringify(variants)} />
                    </div>
                )}

                {!hasVariants && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="price">Base Price (₹)</Label>
                            <Input id="price" type="number" step="0.01" {...form.register("price")} name="price" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="mrp">Base MRP (₹)</Label>
                            <Input id="mrp" type="number" step="0.01" {...form.register("mrp")} name="mrp" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="quantity">Total Quantity</Label>
                            <Input id="quantity" type="number" {...form.register("quantity")} name="quantity" />
                        </div>
                    </div>
                )}
                
                {hasVariants && variants.length > 0 && (
                    <div className="flex gap-4 text-sm font-medium p-2 bg-primary/10 rounded border border-primary/20">
                         <div>Total Quantity: <span className="font-bold">{variants.reduce((sum, v) => sum + (Number(v.quantity) || 0), 0)}</span></div>
                         <div>Starting Price: <span className="font-bold">₹{Math.min(...variants.map(v => Number(v.price) || 0)).toFixed(2)}</span></div>
                         {/* These hidden inputs ensure the top-level values are still sent even if derived */}
                         <input type="hidden" name="quantity" value={variants.reduce((sum, v) => sum + (Number(v.quantity) || 0), 0)} />
                         <input type="hidden" name="price" value={Math.min(...variants.map(v => Number(v.price) || 0))} />
                    </div>
                )}
            </div>

             <div className="space-y-2 pt-4">
               <Controller
                  control={form.control}
                  name="onWebsite"
                  render={({ field }) => (
                      <div className="flex items-center gap-2">
                          <input type="hidden" name="onWebsite" value={field.value ? "on" : "off"} />
                          <Switch
                              id="onWebsite"
                              name="onWebsite"
                              checked={field.value}
                              onCheckedChange={field.onChange}
                          />
                          <Label htmlFor="onWebsite" className="cursor-pointer">Publish on website</Label>
                          <Badge variant={field.value ? "secondary" : "outline"}>
                              {field.value ? "Yes" : "No"}
                          </Badge>
                      </div>
                  )}
              />
            </div>
        </div>
    </>
  );
}


function PublishToggle({ product, onStatusChange }: { product: Product, onStatusChange: (productId: string, onWebsite: boolean) => void }) {
  const { toast } = useToast();
  
  const handleToggle = async (checked: boolean) => {
    onStatusChange(product.id, checked);
    const result = await updateProductWebsiteStatus(product.id, checked);

    if (result.success) {
      if (result.message !== 'No change in product status.') {
          toast({
              title: "Status Updated",
              description: result.message,
          });
      }
    } else {
      onStatusChange(product.id, !checked);
      toast({
        variant: "destructive",
        title: "Error",
        description: result.message,
      });
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Switch
        id={`publish-${product.id}`}
        checked={product.onWebsite}
        onCheckedChange={handleToggle}
        aria-label="Publish status"
      />
      <Badge variant={product.onWebsite ? "secondary" : "outline"}>
        {product.onWebsite ? "Yes" : "No"}
      </Badge>
    </div>
  )
}

function ReviewStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i < rating ? "fill-yellow-400 text-yellow-400" : "fill-muted-foreground text-muted-foreground"
          }`}
        />
      ))}
    </div>
  );
}


function ProductDetailsDialog({ product }: { product: Product }) {
  return (
    <DialogContent className="sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle className="pr-8">{product.name}</DialogTitle>
        <DialogDescription>
          Viewing details for product ID: {product.id}
        </DialogDescription>
      </DialogHeader>
      <ScrollArea className="max-h-[70vh] p-4">
        <div className="grid gap-6">
          <div className="grid grid-cols-3 sm:grid-cols-4 items-center gap-4">
            <Label className="text-right sm:text-left">Parent SKU</Label>
            <div className="col-span-2 sm:col-span-3">{product.sku}</div>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 items-center gap-4">
            <Label className="text-right sm:text-left">Brand</Label>
            <div className="col-span-2 sm:col-span-3">{product.brand}</div>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 items-start gap-4">
            <Label className="text-right sm:text-left mt-1">Description</Label>
            <div className="col-span-2 sm:col-span-3">
            <p
              dangerouslySetInnerHTML={{
                __html: product.desc || 'N/A'
                  .replace(/\*(.*?)\*/g, '<strong>$1</strong>')   // *text* → bold
                  .replace(/_(.*?)_/g, '<em>$1</em>')             // _text_ → italics
              }}
            />
            </div>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 items-center gap-4">
            <Label className="text-right sm:text-left">Category</Label>
            <div className="col-span-2 sm:col-span-3 capitalize">{product.category}</div>
          </div>
          {product.subCategory && (
              <div className="grid grid-cols-3 sm:grid-cols-4 items-center gap-4">
                  <Label className="text-right sm:text-left">Sub-Category</Label>
                  <div className="col-span-2 sm:col-span-3 capitalize">{product.subCategory}</div>
              </div>
          )}
          <div className="grid grid-cols-3 sm:grid-cols-4 items-start gap-4">
            <Label className="text-right sm:text-left mt-1">Images</Label>
            <div className="col-span-2 sm:col-span-3 grid grid-cols-2 gap-4">
              {product.images?.map((img, index) => (
                <Image
                  key={index}
                  alt={`Product image ${index + 1}`}
                  className="aspect-square w-full rounded-md object-cover"
                  height="100"
                  src={img}
                  width="100"
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Pricing & Inventory</h3>
            {product.hasVariants && product.variants && product.variants.length > 0 ? (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Size</TableHead>
                            <TableHead>SKU</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>MRP</TableHead>
                            <TableHead>Qty</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {product.variants.map((v, i) => (
                            <TableRow key={i}>
                                <TableCell className="font-medium">{v.size}</TableCell>
                                <TableCell className="text-muted-foreground text-xs">{v.sku}</TableCell>
                                <TableCell>₹{v.price.toFixed(2)}</TableCell>
                                <TableCell className="text-muted-foreground">₹{v.mrp?.toFixed(2) || 'N/A'}</TableCell>
                                <TableCell>
                                    <Badge variant={v.quantity > 10 ? "secondary" : (v.quantity > 0 ? "outline" : "destructive")}>
                                        {v.quantity}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            ) : (
                <div className="grid grid-cols-2 gap-4 border p-4 rounded-lg bg-muted/30">
                    <div>
                        <Label className="text-xs text-muted-foreground uppercase">Price</Label>
                        <p className="text-lg font-bold">₹{product.price.toFixed(2)}</p>
                    </div>
                    <div>
                        <Label className="text-xs text-muted-foreground uppercase">MRP</Label>
                        <p className="text-lg text-muted-foreground">₹{product.mrp?.toFixed(2) || 'N/A'}</p>
                    </div>
                    <div>
                        <Label className="text-xs text-muted-foreground uppercase">Quantity</Label>
                        <p className="text-lg font-bold">{product.quantity}</p>
                    </div>
                     <div>
                        <Label className="text-xs text-muted-foreground uppercase">Status</Label>
                        <div>
                             <Badge variant={product.quantity > 10 ? "secondary" : (product.quantity > 0 ? "outline" : "destructive")}>
                                {product.status}
                            </Badge>
                        </div>
                    </div>
                </div>
            )}
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 items-center gap-4">
            <Label className="text-right sm:text-left">Colors</Label>
            <div className="col-span-2 sm:col-span-3 flex flex-wrap gap-2">
              {product.colors?.map(color => <Badge key={color} variant="secondary">{color}</Badge>)}
            </div>
          </div>
          
           <div className="grid grid-cols-3 sm:grid-cols-4 items-center gap-4">
            <Label className="text-right sm:text-left">Overall Rating</Label>
            <div className="col-span-2 sm:col-span-3 flex items-center gap-2">
                <ReviewStars rating={product.rating} />
                <span className="text-sm text-muted-foreground">({product.rating}/5)</span>
            </div>
          </div>
          
           <Separator />

            <div>
                <h3 className="text-lg font-semibold mb-4">Latest Customer Reviews</h3>
                {product.reviews && product.reviews.length > 0 ? (
                    <div className="space-y-6">
                        {product.reviews
                        .slice(product.reviews.length - 4, product.reviews.length)
                        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                        .map((review, index) => (
                            <div key={index} className="grid grid-cols-1 sm:grid-cols-[1fr_3fr] gap-4">
                                <div className="space-y-2">
                                    <p className="font-semibold">{review.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {(new Date(review.createdAt).toLocaleDateString("en-IN", {
                                                                  year: "numeric",
                                                                  month: "long",
                                                                  day: "numeric",
                                                                }) || "No date")}
                                    </p>
                                </div>
                                <div className="space-y-2">
                                     <div className="flex items-center gap-2">
                                        <ReviewStars rating={review.rating} />
                                        <h4 className="font-semibold">{review.title}</h4>
                                    </div>
                                    <p className="text-sm text-muted-foreground">{review.review}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">No reviews for this product yet.</p>
                )}
            </div>

        </div>
      </ScrollArea>
      <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogClose>
    </DialogContent>
  );
}


function AddProductSheet({ children, onProductAdded }: { children: React.ReactNode, onProductAdded: (product: Product) => void }) {
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  
  const initialState: { success: boolean, message: string, errors: any, product?: Product } = { success: false, message: "", errors: null };
  const [state, formAction, isPending] = useActionState(addProductAction, initialState);
  const [formKey, setFormKey] = useState(0);

  const wasPending = React.useRef(isPending);
  useEffect(() => {
    if (wasPending.current && !isPending) {
        if (state.success) {
          toast({
            title: "Product Created",
            description: state.message,
          });
          if (state.product) {
              onProductAdded(state.product);
          }
          if (formRef.current) {
            formRef.current.reset();
          }
          setFormKey(prevKey => prevKey + 1);
          setIsAddSheetOpen(false);
        } else if (state.message && !state.success) {
          toast({
            variant: "destructive",
            title: "Error adding product",
            description: state.message,
          });
        }
    }
    wasPending.current = isPending;
  }, [isPending, state, toast, onProductAdded]);

  const handleOpenChange = (isOpen: boolean) => {
    setIsAddSheetOpen(isOpen);
  };

  return (
    <Sheet open={isAddSheetOpen} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent 
        className="sm:max-w-xl w-full flex flex-col"
        onInteractOutside={(e) => {
           e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          e.preventDefault();
        }}
      >
        <SheetHeader>
          <SheetTitle>Add a New Product</SheetTitle>
          <SheetDescription>
            Fill in the details below to add a new product to your inventory.
          </SheetDescription>
        </SheetHeader>
        <form ref={formRef} action={formAction}>
          <ScrollArea className="flex-grow h-[calc(100vh-200px)]">
            <div className="p-6 pt-4">
              <ProductForm 
                onProductUpdate={() => {}}
                formKey={formKey}
              />
            </div>
          </ScrollArea>
            <SheetFooter className="mt-auto p-6 pt-0 sticky bottom-0 bg-background border-t border-border">
                <Button type="button" variant="outline" disabled={isPending} onClick={() => setIsAddSheetOpen(false)}>
                    Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? (
                      <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                      </>
                  ) : "Save Product" }
                </Button>
            </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}


function EditProductSheet({ product, open, onOpenChange, onProductUpdate }: { product: Product, open: boolean, onOpenChange: (open: boolean) => void, onProductUpdate: (updatedProduct: Product) => void }) {
    const { toast } = useToast();
    const initialState = { success: false, message: "", errors: null };
    const [state, formAction, isPending] = useActionState(updateProductAction.bind(null, product.id), initialState);

    useEffect(() => {
        if (state.success) {
          if (state.message !== 'No changes were made to the product.') {
            toast({ title: "Product Updated", description: state.message });
          }
          onOpenChange(false);
        } else if (state.message) {
          toast({ variant: "destructive", title: "Error", description: state.message });
        }
    }, [state, toast, onOpenChange]);

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent 
                className="sm:max-w-xl w-full flex flex-col"
                onInteractOutside={(e) => {
                  e.preventDefault();
                }}
                onEscapeKeyDown={(e) => {
                  e.preventDefault();
                }}
            >
                <SheetHeader>
                    <SheetTitle>Edit Product</SheetTitle>
                    <SheetDescription>
                        Update the details for &quot;{product.name}&quot;.
                    </SheetDescription>
                </SheetHeader>
                <form action={formAction}>
                    <ScrollArea className="flex-grow h-[calc(100vh-200px)]">
                        <div className="p-6 pt-4">
                            <ProductForm 
                                product={product} 
                                onProductUpdate={onProductUpdate}
                            />
                        </div>
                    </ScrollArea>
                    <SheetFooter className="mt-auto p-6 pt-0 sticky bottom-0 bg-background border-t border-border">
                       <SheetClose asChild>
                           <Button type="button" variant="outline" disabled={isPending}>Cancel</Button>
                       </SheetClose>
                       <Button type="submit" disabled={isPending}>
                         {isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                         ) : "Save Changes" }
                       </Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    );
}


export function InventoryClientPage({ products: initialProducts }: { products: Product[] }) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOption, setSortOption] = useState("latest");
  const productsPerPage = 10;
  const { toast } = useToast();

  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);
  
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortOption]);

  const handleEditClick = (product: Product) => {
    setEditingProduct(product);
    setIsEditSheetOpen(true);
  };
  
  const handleDeleteProduct = async (productId: string) => {
    const result = await deleteProductAction(productId);
    if (result.success) {
      toast({
        variant: 'default',
        title: "Product Deleted",
        description: result.message,
      });
    } else {
        toast({
            variant: 'destructive',
            title: "Error",
            description: result.message,
        });
    }
  }

  const handleViewDetails = (product: Product) => {
    setSelectedProduct(product);
    setIsDetailsOpen(true);
  };

  const handleStatusChange = (productId: string, onWebsite: boolean) => {
    setProducts(prev => 
      prev.map(p => 
        p.id === productId ? { ...p, onWebsite } : p
      )
    );
  };

  const handleProductUpdate = (updatedProduct: Product) => {
    startTransition(() => {
        setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
        if (editingProduct?.id === updatedProduct.id) {
            setEditingProduct(updatedProduct);
        }
    });
  };

  const handleProductAdded = (newProduct: Product) => {
    startTransition(() => {
        setProducts(prev => [newProduct, ...prev]);
        // Re-sort if necessary
        if (sortOption === "name") {
            setProducts(prev => [...prev].sort((a, b) => a.name.localeCompare(b.name)));
        } else if (sortOption === "latest") {
            setProducts(prev => [...prev].sort((a,b) => b.id.localeCompare(a.id)));
        }
    });
  }

  const sortedAndFilteredProducts = useMemo(() => {
    let filtered = products.filter((product) => {
      const query = searchQuery.toLowerCase();
      return (
        product.name.toLowerCase().includes(query) ||
        product.id.toLowerCase().includes(query) ||
        (product.sku && product.sku.toLowerCase().includes(query))
      );
    });

    if (sortOption === "name") {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortOption === "latest") {
      // The initial fetch from the server already sorts by latest (_id)
      // so we just need to preserve that order if products haven't been re-sorted
      filtered.sort((a, b) => b.id.localeCompare(a.id));
    }
    
    return filtered;
  }, [products, searchQuery, sortOption]);
  
  const totalPages = Math.ceil(sortedAndFilteredProducts.length / productsPerPage);
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = sortedAndFilteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
        setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
      if (currentPage > 1) {
          setCurrentPage(currentPage - 1);
      }
  };


  return (
    <>
      <PageHeader title="Inventory" description="Manage your products and stock levels.">
        <AddProductSheet onProductAdded={handleProductAdded}>
          <Button size="sm" className="gap-1">
            <PlusCircle className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Add Product
            </span>
          </Button>
        </AddProductSheet>
      </PageHeader>
      
      {editingProduct && (
        <EditProductSheet 
            key={editingProduct.id}
            product={editingProduct} 
            open={isEditSheetOpen}
            onOpenChange={(isOpen) => {
                setIsEditSheetOpen(isOpen);
                if (!isOpen) setEditingProduct(null);
            }}
            onProductUpdate={handleProductUpdate}
        />
      )}

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <CardTitle>Products</CardTitle>
                    <CardDescription>
                    A list of all products in your inventory.
                    </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search by name, ID, or SKU..."
                            className="w-full sm:w-48 rounded-lg bg-background pl-8"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                     <Select value={sortOption} onValueChange={setSortOption}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="latest">Sort by: Latest</SelectItem>
                            <SelectItem value="name">Sort by: Alphabetical</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="hidden w-[100px] sm:table-cell">
                    <span className="sr-only">Image</span>
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden sm:table-cell">On Website</TableHead>
                  <TableHead className="hidden md:table-cell">Price (Start)</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Qty
                  </TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="hidden sm:table-cell">
                      {product.images && product.images.length > 0 ? (
                        <Image
                          alt="Product image"
                          className="aspect-square rounded-md object-cover"
                          height="64"
                          src={product.images[0]}
                          width="64"
                        />
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-md bg-muted">
                            <ImageIcon className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-xs text-muted-foreground">{product.sku}</div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <PublishToggle product={product} onStatusChange={handleStatusChange} />
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      ₹{product.price.toFixed(2)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {product.quantity}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            aria-haspopup="true"
                            size="icon"
                            variant="ghost"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onSelect={() => handleViewDetails(product)}>Details</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleEditClick(product)}>Edit</DropdownMenuItem>
                          <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>Delete</DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the product &quot;{product.name}&quot;.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteProduct(product.id)}>
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter className="flex items-center justify-between pt-6">
             <div className="text-xs text-muted-foreground">
              Showing <strong>{indexOfFirstProduct + 1}-{Math.min(indexOfLastProduct, sortedAndFilteredProducts.length)}</strong> of <strong>{sortedAndFilteredProducts.length}</strong> products
            </div>
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevPage}
                    disabled={currentPage === 1}
                >
                    Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages > 0 ? totalPages : 1}
                </span>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages || totalPages === 0}
                >
                    Next
                </Button>
            </div>
          </CardFooter>
        </Card>
        {selectedProduct && <ProductDetailsDialog product={selectedProduct} />}
      </Dialog>
    </>
  );
}
