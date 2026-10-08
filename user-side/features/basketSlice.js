import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  restaurantId: null,
  items: [],
};

export const basketSlice = createSlice({
  name: "basket",
  initialState,
  reducers: {
    clearBasket: (state) => {
      state.items = [];
      state.restaurantId = null;
    },

    addToBasket: (state, action) => {
      const itemRestaurantId = action.payload.restaurantId;

      if (!state.restaurantId || state.items.length === 0) {
        state.restaurantId = itemRestaurantId;
      }

      if (state.restaurantId === itemRestaurantId) {
        state.items = [...state.items, action.payload];
      }
    },

    removeFromBasket: (state, action) => {
      const index = state.items.findIndex(
        (item) => item.id === action.payload.id
      );

      let newBasket = [...state.items];

      if (index >= 0) {
        newBasket.splice(index, 1);
      } else {
        console.warn(
          `Cant remove product (id: ${action.payload.id}) as its not in basket!`
        );
      }

      state.items = newBasket;
      if (newBasket.length === 0) {
        state.restaurantId = null;
      }
    },
  },
});

// Action creators are generated for each case reducer function
export const { addToBasket, removeFromBasket, clearBasket } = basketSlice.actions;

export const selectBasketItems = (state) => state.basket.items;

export const selectBasketRestaurantId = (state) => state.basket.restaurantId;

export const selectBasketItemsWithId = (state, id) =>
  state.basket.items.filter((item) => item.id === id);

export const selectBasketTotal = (state) =>
  state.basket.items.reduce((total, item) => (total += item.price), 0);

export default basketSlice.reducer;
