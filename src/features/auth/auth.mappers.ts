import type { Company } from '../../models/company.js';
import type { User } from '../../models/user.js';

export type PublicCompany = {
  id: string;
  name: string;
  slug: string;
  subtitle: string | null;
  logoMarkUrl: string | null;
  logoWordmarkUrl: string | null;
};

export type PublicUser = {
  id: string;
  email: string;
  active: boolean;
  company: PublicCompany;
  createdAt: string;
  updatedAt: string;
};

export function toPublicCompany(company: Company): PublicCompany {
  return {
    id: company.id,
    name: company.name,
    slug: company.slug,
    subtitle: company.subtitle,
    logoMarkUrl: company.logoMarkUrl,
    logoWordmarkUrl: company.logoWordmarkUrl,
  };
}

export function toPublicUser(user: User): PublicUser {
  const company = user.get('company') as Company | undefined;
  if (!company) {
    throw new Error('User was loaded without its company association');
  }

  return {
    id: user.id,
    email: user.email,
    active: user.active,
    company: toPublicCompany(company),
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}
