import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BookOpen, Users, Shield, Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { 
  LoginData, 
  RegisterData, 
  VerifyOTPData,
  ForgotPasswordData,
  ResetPasswordData,
  loginSchema, 
  registerSchema,
  verifyOTPSchema,
  forgotPasswordSchema,
  resetPasswordSchema
} from "../../../shared/mongodb-schemas";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { FcGoogle } from "react-icons/fc";
import { Upload, Camera } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { user, isLoading, loginMutation } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<'auth' | 'verify' | 'forgot' | 'reset'>('auth');
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string>("");
  const [pendingEmail, setPendingEmail] = useState<string>("");
  const { toast } = useToast();

  // Redirect if already logged in
  useEffect(() => {
    if (!isLoading && user) {
      setLocation("/dashboard");
    }
  }, [user, isLoading, setLocation]);

  // Initialize forms when email changes
  useEffect(() => {
    if (pendingEmail) {
      verifyForm.setValue('email', pendingEmail);
    }
  }, [pendingEmail, verifyForm]);

  const loginForm = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      profileImageUrl: "",
    },
  });

  const verifyForm = useForm<VerifyOTPData>({
    resolver: zodResolver(verifyOTPSchema),
    defaultValues: { email: "", otp: "" },
  });

  const forgotForm = useForm<ForgotPasswordData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const resetForm = useForm<ResetPasswordData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { email: "", otp: "", newPassword: "" },
  });

  // Custom register mutation with file upload
  const customRegisterMutation = useMutation({
    mutationFn: async (data: RegisterData & { profileImage?: File }) => {
      const formData = new FormData();
      formData.append('email', data.email);
      formData.append('password', data.password);
      formData.append('firstName', data.firstName);
      formData.append('lastName', data.lastName);
      
      if (data.profileImage) {
        formData.append('profileImage', data.profileImage);
      }

      return fetch('/api/register', {
        method: 'POST',
        body: formData,
      }).then(res => res.json());
    },
    onSuccess: (data) => {
      if (data.needsVerification) {
        setPendingEmail(data.email);
        setStep('verify');
        toast({
          title: "Check your email",
          description: "We've sent you a 6-digit verification code.",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Registration failed",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const verifyEmailMutation = useMutation({
    mutationFn: (data: VerifyOTPData) => apiRequest('/api/verify-email', { method: 'POST', body: data }),
    onSuccess: () => {
      toast({
        title: "Email verified!",
        description: "You can now log in to your account.",
      });
      setStep('auth');
    },
    onError: (error: any) => {
      toast({
        title: "Verification failed",
        description: error.message || "Invalid or expired code",
        variant: "destructive",
      });
    },
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: (data: ForgotPasswordData) => apiRequest('/api/forgot-password', { method: 'POST', body: data }),
    onSuccess: () => {
      setPendingEmail(forgotForm.getValues().email);
      setStep('reset');
      toast({
        title: "Reset code sent",
        description: "Check your email for the password reset code.",
      });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (data: ResetPasswordData) => apiRequest('/api/reset-password', { method: 'POST', body: data }),
    onSuccess: () => {
      toast({
        title: "Password reset successful",
        description: "You can now log in with your new password.",
      });
      setStep('auth');
    },
    onError: (error: any) => {
      toast({
        title: "Reset failed",
        description: error.message || "Invalid or expired reset code",
        variant: "destructive",
      });
    },
  });

  const resendVerificationMutation = useMutation({
    mutationFn: (email: string) => apiRequest('/api/resend-verification', { method: 'POST', body: { email } }),
    onSuccess: () => {
      toast({
        title: "Code resent",
        description: "Check your email for a new verification code.",
      });
    },
  });

  const onLogin = (data: LoginData) => {
    loginMutation.mutate(data);
  };

  const onRegister = (data: RegisterData) => {
    customRegisterMutation.mutate({
      ...data,
      profileImage: profileImage || undefined,
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Email verification step
  if (step === 'verify') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Verify Your Email</CardTitle>
            <CardDescription>
              We've sent a 6-digit code to {pendingEmail}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...verifyForm}>
              <form onSubmit={verifyForm.handleSubmit((data) => verifyEmailMutation.mutate(data))} className="space-y-4">
                <FormField
                  control={verifyForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input type="hidden" {...field} value={pendingEmail} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={verifyForm.control}
                  name="otp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Verification Code</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter 6-digit code"
                          className="text-center text-2xl tracking-widest"
                          maxLength={6}
                          {...field}
                          data-testid="input-otp"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={verifyEmailMutation.isPending} data-testid="button-verify">
                  {verifyEmailMutation.isPending ? "Verifying..." : "Verify Email"}
                </Button>

                <div className="text-center space-y-2">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={() => resendVerificationMutation.mutate(pendingEmail)}
                    disabled={resendVerificationMutation.isPending}
                    data-testid="button-resend"
                  >
                    {resendVerificationMutation.isPending ? "Sending..." : "Resend Code"}
                  </Button>
                  <br />
                  <Button type="button" variant="ghost" onClick={() => setStep('auth')} data-testid="button-back-to-login">
                    Back to Login
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Forgot password step
  if (step === 'forgot') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Forgot Password</CardTitle>
            <CardDescription>
              Enter your email to receive a password reset code
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...forgotForm}>
              <form onSubmit={forgotForm.handleSubmit((data) => forgotPasswordMutation.mutate(data))} className="space-y-4">
                <FormField
                  control={forgotForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="Enter your email"
                            className="pl-10"
                            {...field}
                            data-testid="input-forgot-email"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={forgotPasswordMutation.isPending} data-testid="button-send-reset">
                  {forgotPasswordMutation.isPending ? "Sending..." : "Send Reset Code"}
                </Button>

                <div className="text-center">
                  <Button type="button" variant="ghost" onClick={() => setStep('auth')} data-testid="button-back-from-forgot">
                    Back to Login
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Reset password step
  if (step === 'reset') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Reset Password</CardTitle>
            <CardDescription>
              Enter the code sent to {pendingEmail} and your new password
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...resetForm}>
              <form onSubmit={resetForm.handleSubmit((data) => resetPasswordMutation.mutate({...data, email: pendingEmail}))} className="space-y-4">
                <FormField
                  control={resetForm.control}
                  name="otp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reset Code</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter 6-digit code"
                          className="text-center text-lg tracking-wide"
                          maxLength={6}
                          {...field}
                          data-testid="input-reset-otp"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={resetForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            type="password"
                            placeholder="Enter new password"
                            className="pl-10"
                            {...field}
                            data-testid="input-new-password"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={resetPasswordMutation.isPending} data-testid="button-reset-password">
                  {resetPasswordMutation.isPending ? "Resetting..." : "Reset Password"}
                </Button>

                <div className="text-center">
                  <Button type="button" variant="ghost" onClick={() => setStep('auth')} data-testid="button-back-from-reset">
                    Back to Login
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Hero Section */}
        <div className="space-y-6 text-center lg:text-left">
          <div className="space-y-4">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900">
              Campus <span className="text-blue-600">Bazaar</span>
            </h1>
            <p className="text-xl text-gray-600">
              Your campus marketplace for buying and selling textbooks, electronics, furniture, and more.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-3 justify-center lg:justify-start">
              <div className="bg-blue-100 p-2 rounded-lg">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <span className="text-gray-700">Buy and sell textbooks at student prices</span>
            </div>
            
            <div className="flex items-center space-x-3 justify-center lg:justify-start">
              <div className="flex-shrink-0 bg-green-100 p-2 rounded-lg">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <span className="text-gray-700">Connect with students on your campus</span>
            </div>
            
            <div className="flex items-center space-x-3 justify-center lg:justify-start">
              <div className="bg-purple-100 p-2 rounded-lg">
                <Shield className="h-6 w-6 text-purple-600" />
              </div>
              <span className="text-gray-700">Safe and secure transactions</span>
            </div>
          </div>
        </div>

        {/* Auth Forms */}
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle>Join Campus Bazaar</CardTitle>
            <CardDescription>
              Sign in to your account or create a new one to start trading
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Google OAuth Button */}
            <div className="space-y-4">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => window.location.href = '/auth/google'}
              >
                <FcGoogle className="h-5 w-5 mr-2" />
                Continue with Google
              </Button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-muted-foreground">Or continue with email</span>
                </div>
              </div>
            </div>

            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-4">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input
                                placeholder="Enter your email"
                                className="pl-10"
                                {...field}
                                data-testid="input-email"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your password"
                                className="pl-10 pr-10"
                                {...field}
                                data-testid="input-password"
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                                data-testid="button-toggle-password"
                              >
                                {showPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="text-right">
                      <Button 
                        type="button" 
                        variant="link" 
                        className="px-0 text-sm"
                        onClick={() => setStep('forgot')}
                        data-testid="link-forgot-password"
                      >
                        Forgot password?
                      </Button>
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={loginMutation.isPending}
                      data-testid="button-login"
                    >
                      {loginMutation.isPending ? "Logging in..." : "Login"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="register" className="space-y-4">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                    {/* Profile Image Upload */}
                    <div className="space-y-2">
                      <FormLabel>Profile Image (Optional)</FormLabel>
                      <div className="flex items-center justify-center">
                        <div className="relative">
                          {profileImagePreview ? (
                            <div className="relative w-20 h-20 rounded-full overflow-hidden">
                              <img 
                                src={profileImagePreview} 
                                alt="Profile preview" 
                                className="w-full h-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setProfileImage(null);
                                  setProfileImagePreview("");
                                }}
                                className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                                data-testid="button-remove-image"
                              >
                                ×
                              </button>
                            </div>
                          ) : (
                            <label className="cursor-pointer">
                              <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center hover:border-primary transition-colors">
                                <Camera className="h-8 w-8 text-gray-400" />
                              </div>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleImageChange}
                                data-testid="input-profile-image"
                              />
                            </label>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-center text-gray-600">
                        Click to upload or drag and drop (Max 5MB)
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={registerForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                  placeholder="First name"
                                  className="pl-10"
                                  {...field}
                                  data-testid="input-firstName"
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={registerForm.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                  placeholder="Last name"
                                  className="pl-10"
                                  {...field}
                                  data-testid="input-lastName"
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input
                                placeholder="Enter your email"
                                className="pl-10"
                                {...field}
                                data-testid="input-register-email"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input
                                type={showPassword ? "text" : "password"}
                                placeholder="Create a password"
                                className="pl-10 pr-10"
                                {...field}
                                data-testid="input-register-password"
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                                data-testid="button-toggle-register-password"
                              >
                                {showPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={customRegisterMutation.isPending}
                      data-testid="button-register"
                    >
                      {customRegisterMutation.isPending ? "Creating account..." : "Create Account"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}