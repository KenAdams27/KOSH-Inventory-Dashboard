
"use client";

import { useState, useEffect, useRef, useActionState, useMemo } from "react";
import Image from "next/image";
import { MoreHorizontal, PlusCircle, Search, ImageIcon, X, Star } from "lucide-react";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import type { Product, Review } from "@/lib/types";

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
import { addProductAction, updateProductAction, deleteProductAction, updateProductWebsiteStatus } from "./actions";
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
import imageCompression from "browser-image-compression";


const reviewSchema = z.object({
    name: z.string(),
    rating: z.number(),
    title: z.string(),
    review: z.string(),
    image: z.string().optional(),
    createdAt: z.string().datetime(),
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
  quantity: z.coerce.number().int().min(0, "Quantity must be a positive integer"),
  onWebsite: z.boolean().default(true),
  reviews: z.array(reviewSchema).optional(),
}).refine(data => {
    if (data.category === 'ethnicWear' && data.subCategory) {
        return ["sarees", "kurtas & suits", "stitched suits", "unstitched material"].includes(data.subCategory);
    }
    if (data.category === 'bedsheet' && data.subCategory) {
        return ["pure cotton", "cotton blend"].includes(data.subCategory);
    }
    return true;
}, {
    message: "Sub-category is not valid for the selected category",
    path: ["subCategory"],
});

const subCategoryOptions = {
    ethnicWear: ["sarees", "kurtas & suits", "stitched suits", "unstitched material"],
    bedsheet: ["pure cotton", "cotton blend"],
};


function ProductForm({
  product,
  onSheetOpenChange,
}: {
  product?: Product | null;
  onSheetOpenChange: (isOpen: boolean) => void;
}) {
  const form = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: product ? {
      ...product,
      description: product.desc,
      colors: product.colors?.join(', ') || '',
      sizes: product.sizes?.join(', ') || '',
    } : {
      sku: "",
      name: "",
      brand: "KKOSH",
      description: "",
      category: "ethnicWear",
      subCategory: "sarees",
      colors: "",
      sizes: "",
      price: 0,
      quantity: 0,
    },
  });

  const selectedCategory = form.watch("category");

  useEffect(() => {
    if (selectedCategory) {
        form.setValue("subCategory", subCategoryOptions[selectedCategory][0]);
    }
  }, [selectedCategory, form]);
  

  return (
    <div className="grid gap-6">
       <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="sku">SKU</Label>
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
        <Label>Product Images</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="image1" className="text-sm font-normal text-muted-foreground">Image 1</Label>
            <Input id="image1" name="image1" type="file" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="image2" className="text-sm font-normal text-muted-foreground">Image 2</Label>
            <Input id="image2" name="image2" type="file" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="image3" className="text-sm font-normal text-muted-foreground">Image 3</Label>
            <Input id="image3" name="image3" type="file" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="image4" className="text-sm font-normal text-muted-foreground">Image 4</Label>
            <Input id="image4" name="image4" type="file" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="colors">Colors</Label>
          <Input id="colors" placeholder="e.g. Red, Blue, Green" {...form.register("colors")} name="colors" />
          {form.formState.errors.colors && <p className="text-sm text-destructive">{form.formState.errors.colors.message as string}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="sizes">Sizes</Label>
          <Input id="sizes" placeholder="e.g. S, M, L" {...form.register("sizes")} name="sizes" />
          {form.formState.errors.sizes && <p className="text-sm text-destructive">{form.formState.errors.sizes.message as string}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="price">Price (₹)</Label>
          <Input id="price" type="number" step="0.01" {...form.register("price")} name="price" />
          {form.formState.errors.price && <p className="text-sm text-destructive">{form.formState.errors.price.message as string}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="quantity">Quantity</Label>
          <Input id="quantity" type="number" {...form.register("quantity")} name="quantity" />
          {form.formState.errors.quantity && <p className="text-sm text-destructive">{form.formState.errors.quantity.message as string}</p>}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="onWebsite">Publish on website</Label>
        <Controller
            control={form.control}
            name="onWebsite"
            render={({ field }) => (
                <div className="flex items-center gap-2">
                    <Switch
                        id="onWebsite"
                        name="onWebsite"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                    />
                    <Badge variant={field.value ? "secondary" : "outline"}>
                        {field.value ? "Yes" : "No"}
                    </Badge>
                </div>
            )}
        />
      </div>
    </div>
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
            <Label className="text-right sm:text-left">SKU</Label>
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
          <div className="grid grid-cols-3 sm:grid-cols-4 items-center gap-4">
            <Label className="text-right sm:text-left">Colors</Label>
            <div className="col-span-2 sm:col-span-3 flex flex-wrap gap-2">
              {product.colors?.map(color => <Badge key={color} variant="secondary">{color}</Badge>)}
            </div>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 items-center gap-4">
            <Label className="text-right sm:text-left">Sizes</Label>
            <div className="col-span-2 sm:col-span-3 flex flex-wrap gap-2">
              {product.sizes?.map(size => <Badge key={size} variant="outline">{size}</Badge>)}
            </div>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 items-center gap-4">
            <Label className="text-right sm:text-left">Price</Label>
            <div className="col-span-2 sm:col-span-3">₹{product.price.toFixed(2)}</div>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 items-center gap-4">
            <Label className="text-right sm:text-left">Quantity</Label>
            <div className="col-span-2 sm:col-span-3">{product.quantity}</div>
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


function AddProductSheet({ children }: { children: React.ReactNode }) {
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const { toast } = useToast();
  
  type FormState = {
    success: boolean;
    message: string;
    errors?: any;
  };

  const initialState: FormState = { success: false, message: "" };
  const [formState, formAction] = useActionState(addProductAction, initialState);

  useEffect(() => {
    if (formState.success) {
      toast({
        title: "Product Added",
        description: formState.message,
      });
      setIsAddSheetOpen(false);
    } else if (formState.message) {
      toast({
        variant: "destructive",
        title: "Error adding product",
        description: formState.message,
      });
    }
  }, [formState, toast]);

  return (
    <Sheet open={isAddSheetOpen} onOpenChange={setIsAddSheetOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent 
        className="sm:max-w-xl w-full flex flex-col"
        onInteractOutside={(e) => e.preventDefault()}
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
                onSheetOpenChange={setIsAddSheetOpen}
              />
            </div>
          </ScrollArea>
          <SheetFooter className="mt-auto p-6 pt-0 sticky bottom-0 bg-background border-t border-border">
              <Button type="submit">
                Save Product
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
  
  const editFormRef = useRef<HTMLFormElement>(null);

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

  const handleEditProduct = async (data: FormData) => {
    if (!editingProduct) return;
    const result = await updateProductAction(editingProduct.id, data);
    if (result.success) {
        toast({
            title: "Product Updated",
            description: result.message,
        });
        setIsEditSheetOpen(false);
    } else {
        toast({
            variant: "destructive",
            title: "Error",
            description: result.message,
        });
    }
    setEditingProduct(null);
  }
  
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
  
  const handleEditFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editFormRef.current) return;
    const formData = new FormData(editFormRef.current);
    handleEditProduct(formData);
  };

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
        <AddProductSheet>
          <Button size="sm" className="gap-1">
            <PlusCircle className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Add Product
            </span>
          </Button>
        </AddProductSheet>
      </PageHeader>
      
      <Sheet open={isEditSheetOpen} onOpenChange={(isOpen) => {
          setIsEditSheetOpen(isOpen);
          if (!isOpen) setEditingProduct(null);
      }}>
          <SheetContent className="sm:max-w-xl w-full flex flex-col">
              <SheetHeader>
                  <SheetTitle>Edit Product</SheetTitle>
                  <SheetDescription>
                      Update the details for &quot;{editingProduct?.name}&quot;.
                  </SheetDescription>
              </SheetHeader>
              <form ref={editFormRef} onSubmit={handleEditFormSubmit} >
                <ScrollArea className="flex-grow h-[calc(100vh-200px)]">
                  <div className="p-6 pt-4">
                      <ProductForm 
                        product={editingProduct} 
                        onSheetOpenChange={setIsEditSheetOpen}
                      />
                  </div>
                </ScrollArea>
                <SheetFooter className="mt-auto p-6 pt-0 sticky bottom-0 bg-background border-t border-border">
                  <Button type="submit">
                    Save Changes
                  </Button>
                </SheetFooter>
              </form>
          </SheetContent>
      </Sheet>

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
                  <TableHead className="hidden md:table-cell">Price</TableHead>
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
                    <TableCell className="font-medium">{product.name}</TableCell>
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
