export const ITEM_TYPES = [
  "menu",
  "employee_photo",
  "employee_of_month",
  "social_post",
] as const;

export type ItemType = (typeof ITEM_TYPES)[number];

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  image_url: string;
  enabled: boolean;
  sort_order: number;
  featured: boolean;
  item_type: ItemType;
  created_at: string;
  updated_at: string;
};

export const ITEM_TYPE_META: Record<
  ItemType,
  {
    label: string;
    blurb: string;
    nameLabel: string;
    descriptionLabel: string;
    imageLabel: string;
  }
> = {
  menu: {
    label: "Menu Item",
    blurb: "A sundae or menu offering. Rotates through the 2-up / 3-up menu pages.",
    nameLabel: "Name",
    descriptionLabel: "Description",
    imageLabel: "Photo of the item",
  },
  employee_photo: {
    label: "Employee Photo",
    blurb: "Fun photos of the staff at work. Shown as polaroid-style team slides.",
    nameLabel: "Caption / who's in the photo",
    descriptionLabel: "Extra note (optional)",
    imageLabel: "Staff photo",
  },
  employee_of_month: {
    label: "Employee of the Month",
    blurb: "Showcase one employee for exceptional work with a dedicated spotlight slide.",
    nameLabel: "Employee name",
    descriptionLabel: "Why they're being recognized",
    imageLabel: "Photo of the employee",
  },
  social_post: {
    label: "Social Media Post",
    blurb: "A rave review or a post from our page, shown as a social card on the TV.",
    nameLabel: "Headline (e.g. \u201c5-star review from Sarah\u201d)",
    descriptionLabel: "Post / review text",
    imageLabel: "Screenshot or photo (optional)",
  },
};

export function isItemType(value: string): value is ItemType {
  return (ITEM_TYPES as readonly string[]).includes(value);
}
