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

const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  brand: z.string().min(1, "Brand is required"),
  description: z.string().optional(),
  category: z.enum(["Ethnic wear", "bedsheets"]),
  image1: z.string().url("Please enter a valid image URL").optional(),
  image2: z.string().url("Please enter a valid image URL").optional(),
  image3: z.string().url("Please enter a valid image URL").optional(),
  image4: z.string().url("Please enter a valid image URL").optional(),
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
      image1: "",
      image2: "",
      image3: "",
      image4: "",
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
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="image1">Image 1 URL</Label>
          <Input id="image1" placeholder="https://..." {...form.register("image1")} />
          {form.formState.errors.image1 && <p className="text-sm text-destructive">{form.formState.errors.image1.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="image2">Image 2 URL</Label>
          <Input id="image2" placeholder="https://..." {...form.register("image2")} />
          {form.formState.errors.image2 && <p className="text-sm text-destructive">{form.formState.errors.image2.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="image3">Image 3 URL</Label>
          <Input id="image3" placeholder="https://..." {...form.register("image3")} />
          {form.formState.errors.image3 && <p className="text-sm text-destructive">{form.formState.errors.image3.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="image4">Image 4 URL</Label>
          <Input id="image4" placeholder="https://..." {...form.register("image4")} />
          {form.formState.errors.image4 && <p className="text-sm text-destructive">{form.formState.errors.image4.message}</p>}
        </div>
      </div>
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
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price">Price</Label>
          <Input id="price" type="number" step="0.01" {...form.register("price")} />
          {form.formState.errors.price && <p className="text-sm text-destructive">{form.formState.errors.price.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="quantity">Quantity</Label>
          <Input id="quantity" type="number" {...form.register("quantity")} />
          {form.formState.errors.quantity && <p className="text-sm text-destructive">{form.formState.errors.quantity.message}</p>}
        </div>
      </div>
      <SheetFooter>
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

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const handleAddProduct = (data: z.infer<typeof productSchema>) => {
    const images = [data.image1, data.image2, data.image3, data.image4].filter((url): url is string => !!url);
    const newProduct: Product = {
      id: `prod-${(Math.random() * 1000).toFixed(0)}`,
      name: data.name,
      brand: data.brand,
      description: data.description,
      category: data.category,
      images: images.length > 0 ? images : ["https://picsum.photos/seed/new/400/400"],
      imageHints: images.length > 0 ? images.map(i => 'new product') : ["new product"],
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
          <SheetContent className="sm:max-w-2xl">
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
    </>
  );
}
