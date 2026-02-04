import React, { useState, useEffect, useRef } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Calendar,
  Tag,
  Loader2,
} from "lucide-react";
import { toast } from "../utils/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RichTextEditor } from "../components/showcase/RichTextEditor";
import {
  fetchAllPosts,
  createPost,
  updatePost,
  deletePost,
  fetchBlogStats,
  uploadBlogCoverImage,
} from "../../services/blogService";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Mock data - will be replaced with API calls later
const MOCK_POSTS = [
  {
    id: "1",
    title: "The Future of Waste Management in the Philippines",
    excerpt:
      "Exploring innovative solutions and sustainable practices that are transforming how we handle waste in our communities.",
    category: "Industry Insights",
    status: "published",
    author: "WastePH Team",
    publishedAt: "2024-12-20",
    tags: ["sustainability", "innovation", "waste management"],
    views: 1245,
  },
  {
    id: "2",
    title: "Understanding Different Waste Streams",
    excerpt:
      "A comprehensive guide to identifying and properly managing various types of waste in your business operations.",
    category: "Education",
    status: "published",
    author: "WastePH Team",
    publishedAt: "2024-12-18",
    tags: ["education", "waste streams", "best practices"],
    views: 892,
  },
  {
    id: "3",
    title: "New Regulations Coming in 2025",
    excerpt:
      "Draft article about upcoming environmental regulations and their impact on businesses.",
    category: "Compliance",
    status: "draft",
    author: "WastePH Team",
    publishedAt: null,
    tags: ["compliance", "regulations"],
    views: 0,
  },
];

const CATEGORIES = [
  "Industry Insights",
  "Education",
  "Case Studies",
  "Compliance",
  "Sustainability",
  "Technology",
];

const BlogPosts = () => {
  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    draft: 0,
    archived: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeletingPost, setIsDeletingPost] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    excerpt: "",
    content: "",
    category: "",
    status: "draft",
    tags: "",
    coverImage: "",
    author: "WastePH Team",
  });

  // Cover image upload state
  const [coverImageFile, setCoverImageFile] = useState(null);
  const [coverImagePreview, setCoverImagePreview] = useState(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  // Load posts and stats on mount
  useEffect(() => {
    loadPosts();
    loadStats();
  }, [statusFilter]);

  const loadPosts = async () => {
    setIsLoading(true);
    try {
      const filters = {};
      if (statusFilter !== "all") filters.status = statusFilter;
      if (searchQuery) filters.search = searchQuery;

      const data = await fetchAllPosts(filters);
      setPosts(data);
    } catch (error) {
      console.error("Failed to load posts:", error);
      toast.error("Failed to load blog posts. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await fetchBlogStats();
      setStats(data);
    } catch (error) {
      console.error("Failed to load stats:", error);
    }
  };

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      searchQuery === "" ||
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || post.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCoverImageChange = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Only JPEG, PNG, and WebP images are allowed");
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    setCoverImageFile(file);

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setCoverImagePreview(previewUrl);
  };

  const handleCreatePost = async () => {
    setIsSubmitting(true);
    try {
      // Create post without cover image first
      const postData = {
        ...formData,
        coverImage: null, // Will be uploaded separately
        tags: formData.tags
          ? formData.tags.split(",").map((t) => t.trim())
          : [],
      };

      const newPost = await createPost(postData);

      // Upload cover image if selected
      if (coverImageFile) {
        setIsUploadingCover(true);
        try {
          await uploadBlogCoverImage(newPost.id, coverImageFile);
        } catch (uploadError) {
          console.error("Failed to upload cover image:", uploadError);
          toast.error("Post created but cover image upload failed");
        } finally {
          setIsUploadingCover(false);
        }
      }

      toast.success("Blog post created successfully");
      setIsCreateDialogOpen(false);
      setFormData({
        title: "",
        excerpt: "",
        content: "",
        category: "",
        status: "draft",
        tags: "",
        coverImage: "",
        author: "WastePH Team",
      });
      setCoverImageFile(null);
      setCoverImagePreview(null);
      loadPosts();
      loadStats();
    } catch (error) {
      console.error("Failed to create post:", error);
      const errorMessage = error.message || "Failed to create blog post";

      // Parse and display errors with proper line breaks
      const parts = errorMessage.split(": ");
      if (parts.length > 1 && parts[1].includes(" • ")) {
        const header = parts[0];
        const errors = parts[1].split(" • ");
        toast.error(
          <div className="space-y-1">
            <div className="font-semibold">{header}:</div>
            {errors.map((err, idx) => (
              <div key={idx} className="text-sm">
                • {err}
              </div>
            ))}
          </div>
        );
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditPost = async () => {
    setIsSubmitting(true);
    try {
      const postData = {
        ...formData,
        tags: formData.tags
          ? formData.tags.split(",").map((t) => t.trim())
          : [],
      };

      await updatePost(selectedPost.id, postData);

      // Upload new cover image if selected
      if (coverImageFile) {
        setIsUploadingCover(true);
        try {
          await uploadBlogCoverImage(selectedPost.id, coverImageFile);
        } catch (uploadError) {
          console.error("Failed to upload cover image:", uploadError);
          toast.error("Post updated but cover image upload failed");
        } finally {
          setIsUploadingCover(false);
        }
      }

      toast.success("Blog post updated successfully");
      setIsEditDialogOpen(false);
      setSelectedPost(null);
      setCoverImageFile(null);
      setCoverImagePreview(null);
      loadPosts();
      loadStats();
    } catch (error) {
      console.error("Failed to update post:", error);
      const errorMessage = error.message || "Failed to update blog post";

      // Parse and display errors with proper line breaks
      const parts = errorMessage.split(": ");
      if (parts.length > 1 && parts[1].includes(" • ")) {
        const header = parts[0];
        const errors = parts[1].split(" • ");
        toast.error(
          <div className="space-y-1">
            <div className="font-semibold">{header}:</div>
            {errors.map((err, idx) => (
              <div key={idx} className="text-sm">
                • {err}
              </div>
            ))}
          </div>
        );
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePost = async () => {
    setIsDeletingPost(true);
    try {
      await deletePost(selectedPost.id);
      toast.success("Blog post deleted successfully");
      setIsDeleteDialogOpen(false);
      setSelectedPost(null);
      loadPosts();
      loadStats();
    } catch (error) {
      console.error("Failed to delete post:", error);
      toast.error(error.message || "Failed to delete blog post");
    } finally {
      setIsDeletingPost(false);
    }
  };

  const openEditDialog = (post) => {
    setSelectedPost(post);
    setFormData({
      title: post.title,
      excerpt: post.excerpt,
      content: post.content || "",
      category: post.category,
      status: post.status,
      tags: Array.isArray(post.tags) ? post.tags.join(", ") : "",
      coverImage: post.coverImage || "",
      author: post.author || "WastePH Team",
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (post) => {
    setSelectedPost(post);
    setIsDeleteDialogOpen(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "published":
        return "bg-green-500/10 text-green-600 border-green-500/20";
      case "draft":
        return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
      case "archived":
        return "bg-slate-500/10 text-slate-600 border-slate-500/20";
      default:
        return "bg-slate-500/10 text-slate-600 border-slate-500/20";
    }
  };

  // Apply search filter
  useEffect(() => {
    if (searchQuery) {
      const timer = setTimeout(() => {
        loadPosts();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [searchQuery]);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="dark:border-white/10 dark:bg-black/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="dark:border-white/10 dark:bg-black/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {stats.published}
            </div>
          </CardContent>
        </Card>
        <Card className="dark:border-white/10 dark:bg-black/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Drafts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">
              {stats.draft}
            </div>
          </CardContent>
        </Card>
        <Card className="dark:border-white/10 dark:bg-black/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Archived</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-600">
              {stats.archived}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Card */}
      <Card className="dark:border-white/10 dark:bg-black/40">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Blog Posts</CardTitle>
              <CardDescription>
                Manage your blog content and articles
              </CardDescription>
            </div>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-linear-to-r from-[#15803d] to-[#16a34a] hover:opacity-90"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Post
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Posts List */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="py-12 text-center">
                <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-[#15803d]" />
                <p className="text-muted-foreground">Loading posts...</p>
              </div>
            ) : filteredPosts.length > 0 ? (
              filteredPosts.map((post) => (
                <div
                  key={post.id}
                  className="group rounded-lg border p-4 transition-all hover:shadow-lg border-slate-200 bg-white hover:border-[#15803d]/50 dark:border-white/10 dark:bg-white/5"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                          {post.title}
                        </h3>
                        <Badge className={getStatusColor(post.status)}>
                          {post.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-white/60">
                        {post.excerpt}
                      </p>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Tag className="h-3 w-3" />
                          {post.category}
                        </span>
                        {post.publishedAt && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(post.publishedAt).toLocaleDateString()}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {post.views} views
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(Array.isArray(post.tags) ? post.tags : []).map(
                          (tag) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className="text-xs"
                            >
                              #{tag}
                            </Badge>
                          )
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => openEditDialog(post)}
                        className="hover:bg-[#15803d]/10 hover:text-[#15803d]"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => openDeleteDialog(post)}
                        className="hover:bg-red-500/10 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center">
                <p className="text-muted-foreground">No posts found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog
        open={isCreateDialogOpen || isEditDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateDialogOpen(false);
            setIsEditDialogOpen(false);
            setFormData({
              title: "",
              excerpt: "",
              content: "",
              category: "",
              status: "draft",
              tags: "",
            });
          }
        }}
      >
        <DialogContent
          className="max-h-[90vh] overflow-y-auto sm:max-w-[700px]"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>
              {isCreateDialogOpen ? "Create New Post" : "Edit Post"}
            </DialogTitle>
            <DialogDescription>
              {isCreateDialogOpen
                ? "Fill in the details to create a new blog post"
                : "Update the post details"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Title <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="Enter post title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Excerpt <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="Brief description"
                value={formData.excerpt}
                onChange={(e) =>
                  setFormData({ ...formData, excerpt: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Content <span className="text-red-500">*</span>
              </label>
              <RichTextEditor
                value={formData.content}
                onChange={(value) =>
                  setFormData({ ...formData, content: value })
                }
                placeholder="Write your post content here. Use the toolbar for formatting..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Cover Image</label>
              <Input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleCoverImageChange}
              />
              {coverImagePreview && (
                <div className="mt-2">
                  <img
                    src={coverImagePreview}
                    alt="Cover preview"
                    className="h-32 w-full rounded object-cover"
                  />
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                JPEG, PNG, or WebP. Max 5MB.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Category <span className="text-red-500">*</span>
                </label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category: value })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tags</label>
              <Input
                placeholder="Enter tags separated by commas"
                value={formData.tags}
                onChange={(e) =>
                  setFormData({ ...formData, tags: e.target.value })
                }
              />
              <p className="text-xs text-muted-foreground">
                Separate tags with commas (e.g., sustainability, innovation)
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false);
                setIsEditDialogOpen(false);
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={isCreateDialogOpen ? handleCreatePost : handleEditPost}
              disabled={isSubmitting}
              className="bg-linear-to-r from-[#15803d] to-[#16a34a]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isCreateDialogOpen ? "Creating..." : "Saving..."}
                </>
              ) : isCreateDialogOpen ? (
                "Create Post"
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Post</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedPost?.title}"? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeletingPost}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeletePost}
              disabled={isDeletingPost}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeletingPost ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BlogPosts;
