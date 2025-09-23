"use client";

import { useState } from "react";
import Image from "next/image";
import { MoreHorizontal, PlusCircle, Search } from "lucide-react";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateStockStatus } from "@/ai/flows/real-time-stock-updates";
import { useToast } from "@/hooks/use-toast";
import { products as initialProducts } from "@/lib/data";
import type { Product } from "@/lib/types";

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
  DialogTrigger,
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

const MAX_FILE_SIZE = 5000000; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  brand: z.string().min(1, "Brand is required"),
  description: z.string().optional(),
  category: z.enum(["Ethnic wear", "bedsheets"]),
  image1: z.any().optional(),
  image2: z.any().optional(),
  image3: z.any().optional(),
  image4: z.any().optional(),
  colors: z.string().min(1, "Please enter at least one color"),
  sizes: z.string().min(1, "Please enter at least one size"),
  price: z.coerce.number().min(0, "Price must be a positive number"),
  quantity: z.coerce.number().int().min(0, "Quantity must be a positive integer"),
});

function ProductForm({
  onSave,
}: {
  onSave: (data: z.infer<typeof productSchema>) => void;
}) {
  const form = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      brand: "",
      description: "",
      category: "Ethnic wear",
      colors: "",
      sizes: "",
      price: 0,
      quantity: 0,
    },
  });

  function onSubmit(data: z.infer<typeof productSchema>) {
    onSave(data);
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="name">Product Name</Label>
          <Input id="name" {...form.register("name")} />
          {form.formState.errors.name && <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="brand">Brand</Label>
          <Input id="brand" {...form.register("brand")} />
          {form.formState.errors.brand && <p className="text-sm text-destructive">{form.formState.errors.brand.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" {...form.register("description")} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Controller
          control={form.control}
          name="category"
          render={({ field }) => (
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Ethnic wear">Ethnic wear</SelectItem>
                <SelectItem value="bedsheets">Bedsheets</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="space-y-2">
        <Label>Product Images</Label>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="image1" className="text-sm font-normal text-muted-foreground">Image 1</Label>
            <Input id="image1" type="file" {...form.register("image1")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="image2" className="text-sm font-normal text-muted-foreground">Image 2</Label>
            <Input id="image2" type="file" {...form.register("image2")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="image3" className="text-sm font-normal text-muted-foreground">Image 3</Label>
            <Input id="image3" type="file" {...form.register("image3")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="image4" className="text-sm font-normal text-muted-foreground">Image 4</Label>
            <Input id="image4" type="file" {...form.register("image4")} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="colors">Colors</Label>
          <Input id="colors" placeholder="e.g. Red, Blue, Green" {...form.register("colors")} />
          {form.formState.errors.colors && <p className="text-sm text-destructive">{form.formState.errors.colors.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="sizes">Sizes</Label>
          <Input id="sizes" placeholder="e.g. S, M, L" {...form.register("sizes")} />
          {form.formState.errors.sizes && <p className="text-sm text-destructive">{form.formState.errors.sizes.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="price">Price (₹)</Label>
          <Input id="price" type="number" step="0.01" {...form.register("price")} />
          {form.formState.errors.price && <p className="text-sm text-destructive">{form.formState.errors.price.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="quantity">Quantity</Label>
          <Input id="quantity" type="number" {...form.register("quantity")} />
          {form.formState.errors.quantity && <p className="text-sm text-destructive">{form.formState.errors.quantity.message}</p>}
        </div>
      </div>

      <SheetFooter className="mt-6">
        <SheetClose asChild>
          <Button type="submit">Save Product</Button>
        </SheetClose>
      </SheetFooter>
    </form>
  );
}

function StockStatusToggle({ product }: { product: Product }) {
  const { toast } = useToast();
  const [isInStock, setIsInStock] = useState(product.status !== "Out of Stock");

  const handleToggle = async (checked: boolean) => {
    setIsInStock(checked);
    toast({
      title: "Updating Stock...",
      description: `Setting ${product.name} to ${checked ? 'In Stock' : 'Out of Stock'}.`,
    });
    try {
      const result = await updateStockStatus({ productId: product.id, inStock: checked });
      toast({
        title: "Update Successful",
        description: result.message,
      });
      // In a real app, you would revalidate your data here.
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Could not update stock status.",
      });
      setIsInStock(!checked); // Revert on failure
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Switch
        id={`stock-${product.id}`}
        checked={isInStock}
        onCheckedChange={handleToggle}
        aria-label="Stock status"
      />
      <Badge variant={isInStock ? "secondary" : "destructive"}>
        {isInStock ? "In Stock" : "Out of Stock"}
      </Badge>
    </div>
  )
}

function ProductDetailsDialog({ product }: { product: Product }) {
  return (
    <DialogContent className="sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>{product.name}</DialogTitle>
        <DialogDescription>
          Viewing details for product ID: {product.id}
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-6 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label className="text-right">Brand</Label>
          <div className="col-span-3">{product.brand}</div>
        </div>
        <div className="grid grid-cols-4 items-start gap-4">
          <Label className="text-right mt-1">Description</Label>
          <div className="col-span-3">{product.description || 'N/A'}</div>
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label className="text-right">Category</Label>
          <div className="col-span-3">{product.category}</div>
        </div>
        <div className="grid grid-cols-4 items-start gap-4">
          <Label className="text-right mt-1">Images</Label>
          <div className="col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4">
            {product.images.map((img, index) => (
              <Image
                key={index}
                alt={`Product image ${index + 1}`}
                className="aspect-square w-full rounded-md object-cover"
                height="100"
                src={img}
                width="100"
                data-ai-hint={product.imageHints[index]}
              />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label className="text-right">Colors</Label>
          <div className="col-span-3 flex flex-wrap gap-2">
            {product.colors.map(color => <Badge key={color} variant="secondary">{color}</Badge>)}
          </div>
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label className="text-right">Sizes</Label>
          <div className="col-span-3 flex flex-wrap gap-2">
            {product.sizes.map(size => <Badge key={size} variant="outline">{size}</Badge>)}
          </div>
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label className="text-right">Price</Label>
          <div className="col-span-3">₹{product.price.toFixed(2)}</div>
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label className="text-right">Quantity</Label>
          <div className="col-span-3">{product.quantity}</div>
        </div>
      </div>
    </DialogContent>
  );
}


export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const { toast } = useToast();

  const handleAddProduct = (data: z.infer<typeof productSchema>) => {
    const uploadedImages = [data.image1, data.image2, data.image3, data.image4]
      .map(field => field && field.length > 0 ? URL.createObjectURL(field[0]) : null)
      .filter((url): url is string => !!url);

    const images = uploadedImages.length > 0 ? uploadedImages : ["https://picsum.photos/seed/new/400/400"];
    
    const newProduct: Product = {
      id: `prod-${(Math.random() * 1000).toFixed(0)}`,
      name: data.name,
      brand: data.brand,
      description: data.description,
      category: data.category,
      images: images,
      imageHints: images.map(i => 'new product'),
      colors: data.colors.split(',').map(s => s.trim()),
      sizes: data.sizes.split(',').map(s => s.trim()),
      price: data.price,
      quantity: data.quantity,
      status: data.quantity > 0 ? "In Stock" : "Out of Stock",
    };
    setProducts((prev) => [newProduct, ...prev]);
    setIsSheetOpen(false);
    toast({
      title: "Product Added",
      description: `${data.name} has been added to your inventory.`,
    });
  };
  
  const handleDeleteProduct = (productId: string) => {
    setProducts((prev) => prev.filter(p => p.id !== productId));
    toast({
      variant: 'destructive',
      title: "Product Deleted",
      description: "The product has been removed from your inventory.",
    });
  }

  const handleViewDetails = (product: Product) => {
    setSelectedProduct(product);
    setIsDetailsOpen(true);
  };


  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <PageHeader title="Inventory" description="Manage your products and stock levels.">
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button size="sm" className="gap-1">
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Add Product
              </span>
            </Button>
          </SheetTrigger>
          <SheetContent className="sm:max-w-2xl mr-5">
            <SheetHeader>
              <SheetTitle>Add a New Product</SheetTitle>
              <SheetDescription>
                Fill in the details below to add a new product to your inventory.
              </SheetDescription>
            </SheetHeader>
            <div className="py-4 overflow-y-auto max-h-[calc(100vh-8rem)] pr-4">
              <ProductForm onSave={handleAddProduct} />
            </div>
          </SheetContent>
        </Sheet>
      </PageHeader>
      
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <Card>
          <CardHeader>
            <CardTitle>Products</CardTitle>
            <CardDescription>
              A list of all products in your inventory.
            </CardDescription>
            <div className="relative mt-4">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search products..."
                className="w-full rounded-lg bg-background pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="hidden w-[100px] sm:table-cell">
                    <span className="sr-only">Image</span>
                  </TableHead>
                  <TableHead>Product ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Price</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Quantity
                  </TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="hidden sm:table-cell">
                      <Image
                        alt="Product image"
                        className="aspect-square rounded-md object-cover"
                        height="64"
                        src={product.images[0]}
                        width="64"
                        data-ai-hint={product.imageHints[0]}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{product.id}</TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>
                      <StockStatusToggle product={product} />
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
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteProduct(product.id)}>Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter>
            <div className="text-xs text-muted-foreground">
              Showing <strong>1-{filteredProducts.length}</strong> of <strong>{products.length}</strong>{" "}
              products
            </div>
          </CardFooter>
        </Card>
        {selectedProduct && <ProductDetailsDialog product={selectedProduct} />}
      </Dialog>
    </>
  );
}
