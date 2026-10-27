import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDownRight, ArrowRight, ArrowUpRight, Check, Clock3, LoaderCircle, Pencil, Plus, Search, Trash2, X, Heart, ShoppingBasket, ChefHat, ChevronLeft, ChevronRight, Shuffle } from "lucide-react";
import { request } from "./api";

const categories = ["All", "Breakfast", "Lunch", "Dinner", "Snack", "Dessert"];
const blankRecipe = { name: "", category: "Breakfast", cookingTime: "", ingredients: "", preparationSteps: "" };

function lines(value) {
  return value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

function initialFields(recipe) {
  if (!recipe) return blankRecipe;
  return {
    name: recipe.name,
    category: recipe.category,
    cookingTime: String(recipe.cookingTime),
    ingredients: recipe.ingredients.join("\n"),
    preparationSteps: recipe.preparationSteps.join("\n")
  };
}

function validate(values) {
  if (!values.name.trim() || values.name.trim().length > 120) return "Enter a recipe name (up to 120 characters).";
  if (!categories.slice(1).includes(values.category)) return "Choose a valid category.";
  const ingredients = lines(values.ingredients);
  const preparationSteps = lines(values.preparationSteps);
  if (!ingredients.length || ingredients.length > 100 || ingredients.some((item) => item.length > 1000)) {
    return "Add between 1 and 100 ingredients, one per line.";
  }
  if (!preparationSteps.length || preparationSteps.length > 100 || preparationSteps.some((item) => item.length > 1000)) {
    return "Add between 1 and 100 preparation steps, one per line.";
  }
  const minutes = Number(values.cookingTime);
  if (!String(values.cookingTime).trim() || !Number.isInteger(minutes) || minutes < 0 || minutes > 1440) {
    return "Cooking time must be a whole number between 0 and 1440 minutes.";
  }
  return "";
}

function Overlay({ children, onClose, label, className = "" }) {
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  return (
    <div className="overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className={"dialog " + className} role="dialog" aria-modal="true" aria-label={label}>
        {children}
      </section>
    </div>
  );
}

function RecipeForm({ recipe, onSave, onClose, busy }) {
  const [values, setValues] = useState(() => initialFields(recipe));
  const [error, setError] = useState("");
  const update = (key, value) => {
    setError("");
    setValues((old) => ({ ...old, [key]: value }));
  };
  const submit = (event) => {
    event.preventDefault();
    const problem = validate(values);
    if (problem) {
      setError(problem);
      return;
    }
    onSave({
      name: values.name.trim(),
      category: values.category,
      ingredients: lines(values.ingredients),
      preparationSteps: lines(values.preparationSteps),
      cookingTime: Number(values.cookingTime)
    });
  };

  return (
    <form onSubmit={submit} className="editor">
      <div className="editor-top">
        <div className="editor-label">RECIPE EDITOR <span>/</span> {recipe ? "EDIT" : "NEW ENTRY"}</div>
        <button className="icon-control" type="button" onClick={onClose} aria-label="Close recipe editor"><X size={19}/></button>
      </div>
      <div className="editor-intro">
        <h2>{recipe ? "Edit recipe" : "Add to the book"}<span className="accent-period">.</span></h2>
        <p>Keep the details you need for next time.</p>
      </div>
      <div className="editor-fields">
        <label className="field full-field">
          <span>RECIPE NAME <i>*</i></span>
          <input value={values.name} required maxLength={120} placeholder="e.g. Sunday morning pancakes" onChange={(event) => update("name", event.target.value)}/>
        </label>
        <div className="field-pair">
          <label className="field">
            <span>CATEGORY <i>*</i></span>
            <select value={values.category} onChange={(event) => update("category", event.target.value)}>
              {categories.slice(1).map((name) => <option key={name}>{name}</option>)}
            </select>
          </label>
          <label className="field">
            <span>COOKING TIME <i>*</i> <small>MINUTES</small></span>
            <input type="number" required min="0" max="1440" step="1" placeholder="25" value={values.cookingTime} onChange={(event) => update("cookingTime", event.target.value)}/>
          </label>
        </div>
        <label className="field full-field">
          <span>INGREDIENTS <i>*</i> <small>ONE PER LINE</small></span>
          <textarea rows="5" required value={values.ingredients} placeholder={"2 cups flour\n1 cup milk\n2 eggs"} onChange={(event) => update("ingredients", event.target.value)}/>
        </label>
        <label className="field full-field">
          <span>PREPARATION STEPS <i>*</i> <small>ONE STEP PER LINE</small></span>
          <textarea rows="6" required value={values.preparationSteps} placeholder={"Mix the dry ingredients.\nAdd milk and eggs.\nCook until golden."} onChange={(event) => update("preparationSteps", event.target.value)}/>
        </label>
        {error && <p className="inline-error" role="alert">{error}</p>}
      </div>
      <div className="editor-actions">
        <button type="button" className="text-button" onClick={onClose} disabled={busy}>Cancel</button>
        <button type="submit" className="primary-button" disabled={busy}>
          {busy ? <LoaderCircle size={16} className="spin"/> : <Check size={16}/>}
          {busy ? "Saving…" : recipe ? "Save changes" : "Save recipe"}
        </button>
      </div>
    </form>
  );
}

function RecipeDetails({ recipe, onClose, onEdit, onDelete }) {
  return (
    <div className="recipe-detail">
      <div className="detail-side">
        <div className="detail-side-top"><span>FROM YOUR RECIPE BOOK</span><span>001 / RECIPE</span></div>
        <div>
          <span className="detail-category">{recipe.category}</span>
          <h2>{recipe.name}<span className="accent-period">.</span></h2>
          <div className="detail-time"><Clock3 size={16}/>{recipe.cookingTime} minutes</div>
        </div>
        <span className="detail-side-bottom">RUCHI / RECIPE ARCHIVE</span>
      </div>
      <div className="detail-content">
        <div className="detail-header">
          <span>RECIPE DETAILS</span>
          <button type="button" className="icon-control" onClick={onClose} aria-label="Close recipe details"><X size={20}/></button>
        </div>
        <div className="detail-section">
          <div className="detail-section-heading"><h3>Ingredients</h3><span>{String(recipe.ingredients.length).padStart(2, "0")}</span></div>
          <ul className="ingredient-list">
            {recipe.ingredients.map((ingredient, index) => <li key={index}>{ingredient}</li>)}
          </ul>
        </div>
        <div className="detail-section">
          <div className="detail-section-heading"><h3>Method</h3><span>{String(recipe.preparationSteps.length).padStart(2, "0")} STEPS</span></div>
          <ol className="method-list">
            {recipe.preparationSteps.map((step, index) => <li key={index}><span className="step-no">{String(index + 1).padStart(2, "0")}</span><span>{step}</span></li>)}
          </ol>
        </div>
        <div className="detail-footer">
          <button type="button" className="text-button danger-link" onClick={onDelete}><Trash2 size={15}/> Delete</button>
          <button type="button" className="primary-button" onClick={onEdit}><Pencil size={15}/> Edit recipe</button>
        </div>
      </div>
    </div>
  );
}


function CookingMode({ recipe, onClose }) {
  const [step, setStep] = useState(0);
  const [checked, setChecked] = useState([]);
  const [complete, setComplete] = useState(false);
  const total = recipe.preparationSteps.length;
  const next = () => {
    if (step === total - 1) setComplete(true);
    else setStep((value) => Math.min(value + 1, total - 1));
  };
  useEffect(() => {
    const key = (event) => {
      if (event.target instanceof HTMLElement && ["INPUT", "TEXTAREA"].includes(event.target.tagName)) return;
      if (event.key === "ArrowRight") setStep((value) => Math.min(value + 1, total - 1));
      if (event.key === "ArrowLeft") { setComplete(false); setStep((value) => Math.max(value - 1, 0)); }
    };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [total]);
  return <div className="cook-content">
    <div className="cook-header"><span>COOKING SESSION / {recipe.category.toUpperCase()}</span><button className="icon-control" onClick={onClose} aria-label="Close cooking mode"><X size={19}/></button></div>
    <div className="cook-main">
      <span className="section-kicker">{complete ? "ALL DONE" : "ON THE STOVE"}</span>
      <h2>{recipe.name}</h2>
      <div className="cook-progress"><div style={{width: ((complete ? total : step + 1) / total * 100) + "%"}}/></div>
      {complete ? <div className="cook-step"><span className="cook-step-index">COMPLETE</span><p>Ready to serve.</p><small>Your recipe is finished. Enjoy the meal.</small></div> :
      <div className="cook-step"><span className="cook-step-index">STEP {String(step + 1).padStart(2,"0")} / {String(total).padStart(2,"0")}</span><p>{recipe.preparationSteps[step]}</p></div>}
      <div className="cook-actions"><button className="outline-button" onClick={() => { setComplete(false); setStep((s) => Math.max(0,s-1)); }} disabled={!step && !complete}><ChevronLeft size={18}/> Previous</button><button className="primary-button" onClick={complete ? onClose : next}>{complete ? "Finish" : step === total - 1 ? "Done cooking" : "Next step"}<ChevronRight size={18}/></button></div>
    </div>
    <div className="cook-ingredients"><div className="detail-section-heading"><h3>Before you begin</h3><span>{checked.length}/{recipe.ingredients.length} READY</span></div><p>Tick ingredients as you prepare them.</p>{recipe.ingredients.map((item,i)=><label key={i} className="cook-ingredient"><input type="checkbox" checked={checked.includes(i)} onChange={(event)=>setChecked((old)=>event.target.checked?[...old,i]:old.filter((n)=>n!==i))}/><span>{item}</span></label>)}</div>
  </div>;
}
function ShoppingList({ items, onClose, onToggle, onRemove, onClear, onAdd, busy }) {
  const [input, setInput] = useState("");
  const remaining = items.filter((item)=>!item.checked).length;
  return <div className="shopping-content">
    <div className="cook-header"><span>YOUR KITCHEN / SHOPPING LIST</span><button className="icon-control" onClick={onClose} aria-label="Close shopping list"><X size={19}/></button></div>
    <div className="shopping-main"><span className="section-kicker">BRING THIS TO THE MARKET</span><h2>The shopping list<span className="accent-period">.</span></h2><p>{remaining} ingredient{remaining===1?"":"s"} still to pick up. Your list is saved in the database.</p>
      <form className="shopping-add" onSubmit={(event)=>{event.preventDefault();if(input.trim()){onAdd([input.trim()]);setInput("");}}}><input aria-label="New ingredient" placeholder="Add an ingredient…" maxLength={1000} value={input} onChange={(event)=>setInput(event.target.value)}/><button className="primary-button" disabled={busy||!input.trim()}><Plus size={18}/> Add</button></form>
      {items.length ? <div className="shopping-items">{items.map((item)=><div className="shopping-item" key={item._id}><label><input type="checkbox" checked={item.checked} onChange={(event)=>onToggle(item,event.target.checked)} disabled={busy}/><span className={item.checked?"is-checked":""}>{item.text}</span></label><button onClick={()=>onRemove(item)} disabled={busy} aria-label={"Remove "+item.text}><X size={16}/></button></div>)}</div>:<div className="shopping-empty">Nothing on your list yet. Open a recipe and add its ingredients, or type an item above.</div>}
      {items.some((item)=>item.checked)&&<button className="text-button shopping-clear" onClick={onClear} disabled={busy}><Trash2 size={15}/> Clear checked items</button>}
    </div>
  </div>;
}

export default function App() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(null);
  const [details, setDetails] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);
  const [shopping, setShopping] = useState(false);
  const [shoppingItems, setShoppingItems] = useState([]);
  const [cooking, setCooking] = useState(null);
  const [onlyFavorite, setOnlyFavorite] = useState(false);
  const [quickOnly, setQuickOnly] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const result = await request("/recipes");
      setRecipes(result);
      setLoadError("");
    } catch (error) {
      setLoadError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);
  const refreshShopping = useCallback(async () => {
    try { setShoppingItems(await request("/shopping-list")); }
    catch (error) { notify(error.message, "error"); }
  }, []);
  useEffect(() => { refreshShopping(); }, [refreshShopping]);
  const addShopping = async (ingredients) => {
    setBusy(true);
    try {
      const result = await request("/shopping-list", {method:"POST",body:JSON.stringify({ingredients})});
      setShoppingItems(result.items);
      notify("Added to shopping list.");
    } catch(error){ notify(error.message,"error"); }
    finally {setBusy(false);}
  };
  const changeShopping = async (path, method, body) => {
    setBusy(true);
    try {
      await request(path,{method,...(body?{body:JSON.stringify(body)}:{})});
      await refreshShopping();
    } catch(error){ notify(error.message,"error"); }
    finally{ setBusy(false); }
  };
  const toggleFavorite = async (recipe) => {
    setBusy(true);
    try {
      await request("/recipes/"+recipe._id+"/favorite", {method:"PATCH",body:JSON.stringify({isFavorite:!recipe.isFavorite})});
      await refresh();
      if(details?._id===recipe._id)setDetails({...details,isFavorite:!recipe.isFavorite});
      notify(recipe.isFavorite?"Removed from favorites.":"Saved to favorites.");
    } catch(error){notify(error.message,"error");}
    finally{setBusy(false);}
  };
  const surprise = () => {
    const choices=recipes.filter((item)=>(!onlyFavorite||item.isFavorite)&&(!quickOnly||item.cookingTime<=30));
    if(!choices.length){notify("No recipes match those filters.","error");return;}
    openDetails(choices[Math.floor(Math.random()*choices.length)]);
  };
  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 4200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return recipes.filter((recipe) =>
      (category === "All" || recipe.category === category) &&
      (!onlyFavorite || recipe.isFavorite) && (!quickOnly || recipe.cookingTime <= 30) &&
      (!term || recipe.name.toLowerCase().includes(term) ||
        recipe.ingredients.some((ingredient) => ingredient.toLowerCase().includes(term)))
    );
  }, [recipes, query, category, onlyFavorite, quickOnly]);

  const notify = (message, kind = "success") => setToast({ message, kind });
  const closeModal = useCallback(() => {
    if (busy) return;
    setEditing(null);
    setDetails(null);
    setRemoving(null);
    setShopping(false);
    setCooking(null);
  }, [busy]);

  const openDetails = async (recipe) => {
    try {
      const result = await request("/recipes/" + recipe._id);
      setDetails(result);
    } catch (error) { notify(error.message, "error"); }
  };

  const saveRecipe = async (payload) => {
    setBusy(true);
    const creating = editing === "new";
    try {
      await request(creating ? "/recipes" : "/recipes/" + editing._id, {
        method: creating ? "POST" : "PUT",
        body: JSON.stringify(payload)
      });
      setEditing(null);
      await refresh();
      notify(creating ? "Recipe added to your collection." : "Recipe updated.");
    } catch (error) { notify(error.message, "error"); }
    finally { setBusy(false); }
  };

  const deleteRecipe = async () => {
    if (!removing) return;
    setBusy(true);
    try {
      await request("/recipes/" + removing._id, { method: "DELETE" });
      setDetails(null);
      setRemoving(null);
      await refresh();
      notify("Recipe deleted.");
    } catch (error) { notify(error.message, "error"); }
    finally { setBusy(false); }
  };

  const clearFilters = () => { setQuery(""); setCategory("All"); setOnlyFavorite(false); setQuickOnly(false); };

  return (
    <div className="site" id="top">
      <header className="site-header">
        <div className="container header-inner">
          <a href="#top" className="brand" aria-label="Ruchi home">ruchi</a>
          <span className="header-note">THE LITTLE KITCHEN BOOK</span>
          <button className="header-shopping" onClick={() => setShopping(true)}><ShoppingBasket size={17}/><span>Shopping list</span>{shoppingItems.length>0&&<b>{shoppingItems.filter(x=>!x.checked).length}</b>}</button>
          <button className="header-create" onClick={() => setEditing("new")}><Plus size={16}/> <span>Add recipe</span></button>
        </div>
      </header>
      <main>
        <section className="intro container" aria-labelledby="intro-title">
          <div className="intro-top">
            <span>FROM THE KITCHEN TABLE</span>
            <span>A BOOK OF GOOD THINGS</span>
          </div>
          <div className="intro-body">
            <h1 id="intro-title" className="hero-malayalam"><span>ഇവിടെ</span><span>എല്ലാമുണ്ട്</span></h1>
            <div className="intro-aside">
              <p>For recipes scribbled on scraps, passed across the table, and known by heart. Gather the good ones here, to cook and to keep.</p>
              <a className="intro-link" href="#collection">Open the recipe book <ArrowDownRight size={18}/></a>
            </div>
          </div>
          <div className="intro-bottom"><span>MADE WITH A LITTLE EXTRA LOVE</span><span>STIRRED, SHARED &amp; SAVED <span aria-hidden="true">↗</span></span></div>
        </section>

        <section className="catalog container" id="collection" aria-labelledby="collection-title">
          <div className="catalog-head">
            <div>
              <span className="section-kicker">01 / THE RECIPE BOX</span>
              <div className="catalog-title-line"><h2 id="collection-title">Your recipes</h2><span className="total-count">{String(recipes.length).padStart(2, "0")}</span></div>
            </div>
            <button className="catalog-create" onClick={() => setEditing("new")}>
              <Plus size={17}/> New recipe
            </button>
          </div>

          <div className="catalog-controls">
            <div className="category-tabs" aria-label="Filter by category" role="group">
              {categories.map((name) =>
                <button type="button" key={name} className={"category-tab" + (category === name ? " selected" : "")}
                  aria-pressed={category === name} onClick={() => setCategory(name)}>{name}</button>
              )}
            </div>
            <label className="searchbox">
              <Search size={17}/>
              <span className="sr-only">Search recipes</span>
              <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search recipes"/>
            </label>
          </div>

          <div className="discovery-tools">
            <div className="discovery-filters">
              <button className={onlyFavorite?"active":""} onClick={()=>setOnlyFavorite(x=>!x)} aria-pressed={onlyFavorite}><Heart size={15} fill={onlyFavorite?"currentColor":"none"}/> Favorites</button>
              <button className={quickOnly?"active":""} onClick={()=>setQuickOnly(x=>!x)} aria-pressed={quickOnly}><Clock3 size={15}/> Under 30 min</button>
            </div>
            <button className="surprise-button" onClick={surprise} disabled={!recipes.length}><Shuffle size={15}/> Surprise me</button>
          </div>
          <div className="collection-status"><span>{loading ? "OPENING YOUR COLLECTION" : String(filtered.length).padStart(2, "0") + " RECIPES"}</span><span>NAME / CATEGORY / TIME</span></div>

          {loadError ? (
            <div className="empty-state error-state" role="alert">
              <span className="section-kicker">CONNECTION ERROR</span>
              <h3>Couldn't load your recipes.</h3>
              <p>{loadError}</p>
              <button className="outline-button" onClick={() => { setLoading(true); refresh(); }}>Try again <ArrowRight size={16}/></button>
            </div>
          ) : loading ? (
            <div className="empty-state loading-state"><LoaderCircle size={24} className="spin"/><p>Loading your recipes…</p></div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <span className="empty-index">{recipes.length ? "?" : "00"}</span>
              <div>
                <span className="section-kicker">{recipes.length ? "NOTHING FOUND" : "A BLANK PAGE"}</span>
                <h3>{recipes.length ? "No matching recipes." : "Every collection starts somewhere."}</h3>
                <p>{recipes.length ? "Try another category or a different search." : "Add the first recipe to your book. You can always come back and edit it later."}</p>
                {recipes.length ?
                  <button className="outline-button" onClick={clearFilters}>Clear filters <ArrowRight size={16}/></button> :
                  <button className="primary-button" onClick={() => setEditing("new")}><Plus size={16}/> Add your first recipe</button>}
              </div>
            </div>
          ) : (
            <div className="recipe-grid">
              {filtered.map((recipe, index) =>
                <article className="recipe-card" key={recipe._id}>
                  <button type="button" className="recipe-card-main" onClick={() => openDetails(recipe)} aria-label={"View " + recipe.name}>
                    <div className="card-top">
                      <span className="card-number">NO. {String(index + 1).padStart(3, "0")}</span>
                      <span className="card-category">{recipe.category}</span>
                    </div>
                    <div className="card-center">
                      <span className="card-subtitle">FROM THE RECIPE BOOK</span>
                      <h3>{recipe.name}</h3>
                      <p>{recipe.ingredients.slice(0, 3).join(" · ")}</p>
                    </div>
                    <div className="card-actionline"><span>VIEW THE RECIPE</span><ArrowUpRight size={20}/></div>
                  </button>
                  <div className="card-footer">
                    <span className="card-time"><Clock3 size={15}/>{recipe.cookingTime} MIN</span>
                    <div className="card-buttons">
                      <button type="button" className={recipe.isFavorite?"favorite-active":""} onClick={()=>toggleFavorite(recipe)} disabled={busy} aria-label={recipe.isFavorite?"Remove "+recipe.name+" from favorites":"Favorite "+recipe.name}><Heart size={16} fill={recipe.isFavorite?"currentColor":"none"}/></button>
                      <button type="button" onClick={() => setEditing(recipe)} aria-label={"Edit " + recipe.name}><Pencil size={15}/> Edit</button>
                      <button type="button" onClick={() => setRemoving(recipe)} aria-label={"Delete " + recipe.name}><Trash2 size={15}/> Delete</button>
                    </div>
                  </div>
                </article>
              )}
            </div>
          )}
        </section>
      </main>

      <footer className="site-footer"><div className="container footer-inner"><a className="brand" href="#top">ruchi</a><span>THE LITTLE KITCHEN BOOK</span><span>A GOOD RECIPE IS WORTH KEEPING.</span></div></footer>

      {toast && <div className={"toast" + (toast.kind === "error" ? " toast-error" : "")} role="status">
        {toast.kind === "error" ? <X size={16}/> : <Check size={16}/>}
        <span>{toast.message}</span>
        <button onClick={() => setToast(null)} aria-label="Dismiss"><X size={16}/></button>
      </div>}

      {shopping && <Overlay label="Shopping list" onClose={closeModal} className="shopping-dialog"><ShoppingList items={shoppingItems} onClose={closeModal} busy={busy} onAdd={addShopping} onToggle={(item,checked)=>changeShopping("/shopping-list/"+item._id,"PATCH",{checked})} onRemove={(item)=>changeShopping("/shopping-list/"+item._id,"DELETE")} onClear={()=>changeShopping("/shopping-list/checked","DELETE")}/></Overlay>}
      {cooking && <Overlay label={"Cooking "+cooking.name} onClose={closeModal} className="cooking-dialog"><CookingMode recipe={cooking} onClose={closeModal}/></Overlay>}
      {editing && <Overlay label={editing === "new" ? "Add a recipe" : "Edit a recipe"} onClose={closeModal} className="edit-dialog">
        <RecipeForm key={editing === "new" ? "new" : editing._id} recipe={editing === "new" ? null : editing} onSave={saveRecipe} onClose={closeModal} busy={busy}/>
      </Overlay>}

      {details && !editing && <Overlay label={details.name + " recipe details"} onClose={closeModal} className="detail-dialog">
        <div className="detail-extra-actions">
          <button onClick={()=>toggleFavorite(details)} disabled={busy}><Heart size={16} fill={details.isFavorite?"currentColor":"none"}/>{details.isFavorite?"Saved favorite":"Save favorite"}</button>
          <button onClick={()=>addShopping(details.ingredients)} disabled={busy}><ShoppingBasket size={16}/> Add ingredients</button>
          <button className="detail-cook-button" onClick={()=>{setCooking(details);setDetails(null)}}><ChefHat size={16}/> Start cooking <ArrowRight size={16}/></button>
        </div>
        <RecipeDetails recipe={details} onClose={closeModal} onEdit={() => { setEditing(details); setDetails(null); }} onDelete={() => setRemoving(details)}/>
      </Overlay>}

      {removing && <Overlay label="Confirm delete" onClose={closeModal} className="delete-dialog">
        <div className="delete-top"><span>REMOVE RECIPE</span><button className="icon-control" onClick={closeModal} aria-label="Close"><X size={18}/></button></div>
        <h2>Delete this recipe?</h2>
        <p><strong>{removing.name}</strong> will be permanently removed from your collection. This can't be undone.</p>
        <div className="delete-actions"><button className="outline-button" onClick={closeModal} disabled={busy}>Keep recipe</button><button className="delete-button" onClick={deleteRecipe} disabled={busy}>{busy ? "Deleting…" : "Delete recipe"}</button></div>
      </Overlay>}
    </div>
  );
}
