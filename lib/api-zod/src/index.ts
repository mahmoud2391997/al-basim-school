export * from "./generated/api";
export * from "./generated/types";

// Keep the route schemas explicit so workspace consumers receive these exports
// consistently in both source and declaration builds.
export {
  ReturnBorrowParams,
  ReturnBorrowResponse,
  UpdateBookBody,
  UpdateBookParams,
  UpdateBookResponse,
} from "./generated/api";
