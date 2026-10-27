import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Check, ChefHat, Clock3, Coffee, Cookie, Heart, Leaf, Menu, Pencil, Plus, Search, SlidersHorizontal, Sparkles, Trash2, UtensilsCrossed, X } from "lucide-react";
import { request } from "./api";

const CATEGORIES = ["All recipes", "Breakfast", "Lunch", "Dinner", "Snack", "Dessert"];
const CATEGORY_ICON = { Breakfast: Coffee, Lunch: Leaf, Dinner: UtensilsCrossed, Snack: Cookie, Dessert: Sparkles };
const INITIAL_FORM = { name: "", category: "Breakfast", cookingTime: "", ingredients: "", preparationSteps: "" };

function toForm(recipe) {
  return { name: recipe.name, category: recipe.category, cookingTime: String(recipe.cookingTime), ingredients: recipe.ingredients.join("\n"), preparationSteps: recipe.preparationSteps.join("\n") };
}
function parseLines(text) { return text.split(/\r?\n/).map((s) => s.trim()).filter(Boolean); }
function validate(form) {
  if (!form.name.trim() || form.name.trim().length > 120) return "Recipe name is required (maximum 120 characters).";
  if (!CATEGORIES.slice(1).includes(form.category)) return "Choose a valid category.";
  if (form.ingredients.split(/\r?\n/).some((s) => !s.trim()) || !parseLines(form.ingredients).length) return "Enter at least one ingredient, one per line.";
  if (form.preparationSteps.split(/\r?\n/).some((s) => !s.trim()) || !parseLines(form.preparationSteps).length) return "Enter at least one preparation step, one per line.";
  const mins = Number(form.cookingTime);
  if (form.cookingTime.trim() === "" || !Number.isInteger(mins) || mins < 0 || mins > 1440) return "Cooking time must be a whole number from 0 to 1440.";
  return null;
}
function RecipeIllustration({ category }) {
  const Icon = CATEGORY_ICON[category] || ChefHat;
  return <div className={"recipe-art art-" + category.toLowerCase()}><div className="art-circle"><Icon size={52} strokeWidth={1.1}/></div><span className="art-grain one">✳</span><span className="art-grain two">✶</span></div>;
}
function Modal({ children, onClose, className = "" }) {
  useEffect(() => {
    const onKeyDown = (event) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKeyDown);
    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKeyDown); document.body.style.overflow = before; };
  }, [onClose]);
  return <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}><section className={"modal " + className} role="dialog" aria-modal="true" aria-label="Recipe dialog">{children}</section></div>;
}
function RecipeForm({ recipe, onCancel, onSave, busy }) {
  const [form, setForm] = useState(recipe ? toForm(recipe) : INITIAL_FORM);
  const [error, setError] = useState("");
  const update = (key, value) => { setError(""); setForm((current) => ({ ...current, [key]: value })); };
  const submit = (event) => {
    event.preventDefault();
    const message = validate(form);
    if (message) return setError(message);
    onSave({ name: form.name.trim(), category: form.category, ingredients: parseLines(form.ingredients), preparationSteps: parseLines(form.preparationSteps), cookingTime: Number(form.cookingTime) });
  };
  return <form onSubmit={submit} className="recipe-form">
    <div className="modal-heading"><div><span className="eyebrow">YOUR KITCHEN, YOUR STORIES</span><h2>{recipe ? "Edit your recipe" : "Add a new recipe"}</h2><p>Every delicious dish deserves a little space of its own.</p></div><button className="icon-btn" type="button" onClick={onCancel} aria-label="Close"><X size={21}/></button></div>
    <div className="form-content">
      <label className="field"><span>Recipe name <b>*</b></span><input maxLength={120} value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="e.g. Grandma's lemon cake" required/></label>
      <div className="form-row">
        <label className="field"><span>Category <b>*</b></span><select value={form.category} onChange={(e) => update("category", e.target.value)}>{CATEGORIES.slice(1).map((category) => <option key={category}>{category}</option>)}</select></label>
        <label className="field"><span>Cooking time (min) <b>*</b></span><input type="number" inputMode="numeric" min="0" max="1440" step="1" value={form.cookingTime} onChange={(e) => update("cookingTime", e.target.value)} placeholder="30" required/></label>
      </div>
      <label className="field"><span>Ingredients <b>*</b></span><small>One ingredient per line</small><textarea rows="5" value={form.ingredients} onChange={(e) => update("ingredients", e.target.value)} placeholder={"2 cups all-purpose flour\n1 cup milk\n2 eggs"} required/></label>
      <label className="field"><span>Preparation steps <b>*</b></span><small>One step per line, in order</small><textarea rows="5" value={form.preparationSteps} onChange={(e) => update("preparationSteps", e.target.value)} placeholder={"Mix the dry ingredients.\nWhisk in the wet ingredients.\nBake until golden."} required/></label>
      {error && <p className="form-error" role="alert">{error}</p>}
    </div>
    <div className="form-actions"><button type="button" className="btn btn-quiet" onClick={onCancel}>Cancel</button><button type="submit" className="btn btn-primary" disabled={busy}>{busy ? "Saving…" : recipe ? "Save changes" : "Save recipe"}<Check size={17}/></button></div>
  </form>;
}
export default function App() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [category, setCategory] = useState("All recipes");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(null);
  const [details, setDetails] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);

  const notify = (message, kind = "success") => {
    setToast({ message, kind });
    window.clearTimeout(notify.timer);
    notify.timer = window.setTimeout(() => setToast(null), 4200);
  };
  const refresh = useCallback(async () => {
    try {
      const items = await request("/recipes");
      setRecipes(items);
      setLoadError("");
    } catch (error) {
      setLoadError(error.message);
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);
  const filtered = useMemo(() => recipes.filter((recipe) => (category === "All recipes" || recipe.category === category) && (recipe.name.toLowerCase().includes(query.toLowerCase().trim()) || recipe.ingredients.some((ingredient) => ingredient.toLowerCase().includes(query.toLowerCase().trim())))), [recipes, category, query]);
  const categoryCount = new Set(recipes.map((r) => r.category)).size;
  const averageTime = recipes.length ? Math.round(recipes.reduce((total, r) => total + r.cookingTime, 0) / recipes.length) : 0;
  const save = async (payload) => {
    setBusy(true);
    try {
      await request(editing === "new" ? "/recipes" : "/recipes/" + editing._id, { method: editing === "new" ? "POST" : "PUT", body: JSON.stringify(payload) });
      setEditing(null);
      await refresh();
      notify(editing === "new" ? "Your recipe was added to the book!" : "Your recipe has been updated.");
    } catch (error) { notify(error.message, "error"); } finally { setBusy(false); }
  };
  const openDetails = async (recipe) => {
    try {
      const result = await request("/recipes/" + recipe._id);
      setDetails(result);
    } catch (error) { notify(error.message, "error"); }
  };
  const remove = async () => {
    if (!removing) return;
    setBusy(true);
    try {
      await request("/recipes/" + removing._id, { method: "DELETE" });
      setRemoving(null);
      setDetails(null);
      await refresh();
      notify("Recipe removed from your book.");
    } catch (error) { notify(error.message, "error"); } finally { setBusy(false); }
  };
  const closeModal = useCallback(() => { if (!busy) { setDetails(null); setEditing(null); setRemoving(null); } }, [busy]);

  return <div className="site">
    <header className="header shell"><a href="/" className="brand" aria-label="Savour home"><div className="brand-icon"><UtensilsCrossed size={20}/></div><span>savour<span className="brand-dot">.</span></span></a><div className="header-right"><span className="header-label"><Heart size={15}/> Made with love, kept forever</span><button className="btn btn-primary header-add" onClick={() => setEditing("new")}><Plus size={18}/> Add a recipe</button></div></header>
    <main>
      <section className="hero"><div className="shell hero-inner"><div className="hero-copy"><span className="eyebrow"><span className="eyebrow-line"/> THE PERSONAL RECIPE JOURNAL</span><h1>Good food.<br/><em>Great memories.</em></h1><p>Your favorite recipes, all in one beautiful place. Collect the dishes you love, keep the stories alive, and cook something wonderful.</p><button className="btn btn-primary hero-button" onClick={() => setEditing("new")}>Add your first recipe <ArrowRight size={18}/></button><div className="hero-note"><span className="small-flower">✳</span> Every recipe tells a story.</div></div><div className="hero-art" aria-hidden="true"><div className="hero-blob"><div className="plate"><div className="plate-inner"><Leaf size={72} strokeWidth={1.1}/><span>freshly made</span></div></div></div><div className="art-caption caption-top">made with<br/><em>love & care</em> <span>✽</span></div><div className="art-caption caption-bottom">from your kitchen<br/>to your heart <span>♡</span></div><div className="hero-sparkle">✳</div></div></div></section>
      <section className="stats shell"><div className="stat"><div className="stat-icon"><BookOpen size={20}/></div><div><strong>{recipes.length.toString().padStart(2, "0")}</strong><span>Recipes collected</span></div></div><div className="stat-divider"/><div className="stat"><div className="stat-icon"><ChefHat size={20}/></div><div><strong>{String(categoryCount).padStart(2, "0")}</strong><span>Categories explored</span></div></div><div className="stat-divider"/><div className="stat"><div className="stat-icon"><Clock3 size={20}/></div><div><strong>{averageTime}<small> min</small></strong><span>Average cook time</span></div></div></section>
      <section className="collection shell" id="recipes"><div className="section-head"><div><span className="eyebrow">A LITTLE BIT OF EVERYTHING</span><h2>My recipe <em>collection</em><span className="section-flower"> ✳</span></h2><p>All the dishes worth making again.</p></div><button className="btn btn-secondary desktop-add" onClick={() => setEditing("new")}><Plus size={18}/> New recipe</button></div>
        <div className="toolbar"><div className="search-wrap"><Search size={19}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search recipes or ingredients..." aria-label="Search recipes"/></div><div className="filter-label"><SlidersHorizontal size={17}/> Filter by</div><div className="category-scroller" role="group" aria-label="Filter recipes by category">{CATEGORIES.map((c) => <button key={c} className={"chip " + (category === c ? "active" : "")} onClick={() => setCategory(c)}>{c}</button>)}</div></div>
        {loadError && <div className="state-message error-state" role="alert"><h3>We couldn't load your recipes</h3><p>{loadError}</p><button className="btn btn-secondary" onClick={() => { setLoading(true); refresh(); }}>Try again</button></div>}
        {!loadError && loading && <div className="state-message"><div className="spinner"/><p>Opening your recipe book…</p></div>}
        {!loadError && !loading && filtered.length === 0 && <div className="empty-state"><div className="empty-picture"><BookOpen size={53} strokeWidth={1.15}/><span>✳</span></div><span className="eyebrow">{recipes.length ? "NOTHING FOUND" : "A FRESH START"}</span><h3>{recipes.length ? "No recipes match your search" : "Your recipe book starts here"}</h3><p>{recipes.length ? "Try a different search or category to see more delicious ideas." : "All great collections begin with one dish. Add a recipe you love and let your collection grow."}</p>{recipes.length ? <button className="btn btn-secondary" onClick={() => { setQuery(""); setCategory("All recipes"); }}>Clear filters <ArrowRight size={17}/></button> : <button className="btn btn-primary" onClick={() => setEditing("new")}><Plus size={17}/> Add your first recipe</button>}</div>}
        {!loadError && !loading && filtered.length > 0 && <div className="recipe-grid">{filtered.map((recipe) => { const Icon = CATEGORY_ICON[recipe.category] || ChefHat; return <article key={recipe._id} className="recipe-card"><button className="card-picture" onClick={() => openDetails(recipe)} aria-label={"View " + recipe.name}><RecipeIllustration category={recipe.category}/><span className="category-badge"><Icon size={13}/>{recipe.category}</span></button><div className="card-body"><span className="card-eyebrow">FROM MY KITCHEN</span><button className="card-title" onClick={() => openDetails(recipe)}>{recipe.name}</button><div className="card-foot"><span className="time"><Clock3 size={16}/>{recipe.cookingTime} min</span><button className="view-link" onClick={() => openDetails(recipe)}>View recipe <ArrowRight size={16}/></button></div></div><div className="card-actions"><button onClick={() => setEditing(recipe)}><Pencil size={15}/> Edit</button><button className="delete-link" onClick={() => setRemoving(recipe)}><Trash2 size={15}/> Delete</button></div></article>; })}</div>}
      </section>
    </main>
    <footer className="footer"><div className="shell footer-content"><div className="brand footer-brand"><div className="brand-icon"><UtensilsCrossed size={17}/></div><span>savour<span className="brand-dot">.</span></span></div><span>Made for the recipes you never want to forget.</span><span>Cook. Share. Remember. ♡</span></div></footer>
    {toast && <div className={"toast " + (toast.kind === "error" ? "toast-error" : "")} role="status">{toast.kind === "error" ? <X size={18}/> : <Check size={18}/>} {toast.message}<button aria-label="Dismiss notification" onClick={() => setToast(null)}><X size={16}/></button></div>}
    {editing && <Modal onClose={closeModal} className="form-modal"><RecipeForm key={editing === "new" ? "new" : editing._id} recipe={editing === "new" ? null : editing} onSave={save} onCancel={closeModal} busy={busy}/></Modal>}
    {details && !editing && <Modal onClose={closeModal} className="detail-modal"><button className="icon-btn detail-close" onClick={closeModal} aria-label="Close"><X size={21}/></button><RecipeIllustration category={details.category}/><div className="detail-body"><span className="eyebrow">{details.category.toUpperCase()} · {details.cookingTime} MINUTES</span><h2>{details.name}</h2><p className="detail-intro">A little something delicious, straight from your collection.</p><div className="detail-columns"><section><h3>Ingredients <span>{details.ingredients.length}</span></h3><ul className="ingredient-list">{details.ingredients.map((item, i) => <li key={i}><span className="ingredient-dot"/> {item}</li>)}</ul></section><section><h3>How to make it</h3><ol className="steps-list">{details.preparationSteps.map((step, i) => <li key={i}><span>{String(i + 1).padStart(2, "0")}</span><p>{step}</p></li>)}</ol></section></div><div className="detail-actions"><button className="btn btn-secondary" onClick={() => setRemoving(details)}><Trash2 size={17}/> Delete</button><button className="btn btn-primary" onClick={() => { setEditing(details); setDetails(null); }}><Pencil size={16}/> Edit recipe</button></div></div></Modal>}
    {removing && <Modal onClose={closeModal} className="confirm-modal"><div className="confirm-icon"><Trash2 size={27}/></div><h2>Remove this recipe?</h2><p>“{removing.name}” will be permanently removed from your recipe book. This can't be undone.</p><div className="confirm-buttons"><button className="btn btn-secondary" onClick={closeModal}>Keep recipe</button><button className="btn btn-danger" onClick={remove} disabled={busy}>{busy ? "Removing…" : "Yes, delete it"}</button></div></Modal>}
  </div>;
}
