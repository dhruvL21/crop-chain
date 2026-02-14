'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useEffect, useState, useRef, useLayoutEffect, useMemo } from 'react';
import { doc, getDoc } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Logo } from '@/components/app/logo';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useUser, useFirestore } from '@/firebase';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/hooks/use-language';

const useLoginFormSchema = () => {
  const { t } = useLanguage();
  return useMemo(
    () =>
      z.object({
        email: z.string().email({ message: t('login.validation.email') }),
        password: z
          .string()
          .min(6, { message: t('login.validation.password') }),
      }),
    [t]
  );
};

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const { t } = useLanguage();
  const formSchema = useLoginFormSchema();

  const [activeTab, setActiveTab] = useState('farmer');
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0, opacity: 0 });
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const farmerTabRef = useRef<HTMLButtonElement>(null);
  const buyerTabRef = useRef<HTMLButtonElement>(null);

  useLayoutEffect(() => {
    const setIndicator = () => {
      const activeTabRef = activeTab === 'farmer' ? farmerTabRef : buyerTabRef;
      const tabsContainerNode = tabsContainerRef.current;

      if (activeTabRef.current && tabsContainerNode) {
        const containerRect = tabsContainerNode.getBoundingClientRect();
        const tabRect = activeTabRef.current.getBoundingClientRect();

        setIndicatorStyle({
          left: tabRect.left - containerRect.left,
          width: tabRect.width,
          opacity: 1,
        });
      }
    };

    setIndicator();
    window.addEventListener('resize', setIndicator);

    return () => {
      window.removeEventListener('resize', setIndicator);
    };
  }, [activeTab]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/dashboard');
    }
  }, [user, isUserLoading, router]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (auth && firestore) {
      try {
        const userCredential = await signInWithEmailAndPassword(
          auth,
          values.email,
          values.password
        );
        const user = userCredential.user;

        const userDocRef = doc(firestore, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          if (userData.role === activeTab) {
            router.push('/dashboard');
          } else {
            await auth.signOut();
            toast({
              variant: 'destructive',
              title: t('login.authFailed'),
              description: t('login.wrongRole', { role: userData.role }),
            });
          }
        } else {
          await auth.signOut();
          toast({
            variant: 'destructive',
            title: t('login.authFailed'),
            description: t('login.noProfile'),
          });
        }
      } catch (error: any) {
        let description = 'There was a problem with sign-in.';
        if (
          error.code === 'auth/invalid-credential' ||
          error.code === 'auth/user-not-found' ||
          error.code === 'auth/wrong-password'
        ) {
          description = t('login.invalidCredentials');
        } else if (error.message) {
          description = error.message;
        }

        toast({
          variant: 'destructive',
          title: t('login.loginFailed'),
          description: description,
        });
      }
    }
  };

  if (isUserLoading || user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-background">
      <div className="flex min-h-screen w-full items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader className="space-y-4 text-center">
              <div className="flex justify-center">
                <Logo />
              </div>

              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                defaultValue="farmer"
                className="w-full"
              >
                <TabsList
                  ref={tabsContainerRef}
                  className="relative grid w-full grid-cols-2"
                >
                  <div
                    className="absolute top-1 bottom-1 rounded-sm bg-background/70 backdrop-blur-sm shadow-sm transition-all duration-500 ease-in-out"
                    style={indicatorStyle}
                  />
                  <TabsTrigger
                    ref={farmerTabRef}
                    value="farmer"
                    className="relative z-10 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                  >
                    {t('login.farmer')}
                  </TabsTrigger>
                  <TabsTrigger
                    ref={buyerTabRef}
                    value="buyer"
                    className="relative z-10 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                  >
                    {t('login.buyer')}
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <CardTitle className="text-3xl font-semibold tracking-tight sm:text-4xl">
                {t('login.welcome')}
              </CardTitle>
              <CardDescription className="pt-2 text-base sm:text-lg">
                {t('login.welcomeDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="grid gap-4"
                >
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('login.email')}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t('login.emailPlaceholder')}
                            {...field}
                            suppressHydrationWarning
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center">
                          <FormLabel>{t('login.password')}</FormLabel>
                          <Link
                            href="/forgot-password"
                            className="ml-auto inline-block text-sm underline"
                          >
                            {t('login.forgotPassword')}
                          </Link>
                        </div>
                        <FormControl>
                          <Input
                            type="password"
                            {...field}
                            suppressHydrationWarning
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" suppressHydrationWarning>
                    {t('login.login')}
                  </Button>
                </form>
              </Form>
            </CardContent>
            <CardFooter className="flex justify-center text-sm">
              <p>{t('login.noAccount')}</p>
              <Link href="/signup" className="underline ml-1">
                {t('login.signUp')}
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
