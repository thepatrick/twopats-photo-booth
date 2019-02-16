function enumSettings(settings, gui) {
  Object.entries(settings).forEach(([key, val]) => {
    // console.log(key, val, val.type);
    if (["window", "section"].includes(val.type)) {
      enumSettings(val.children, gui.addFolder(val.label));
    } else {
      const foo = {
        [val.label]: val.value
      };
      // const changeFn = async newValue => {
      //   console.log(val.label, "changed to", newValue);
      //   const response = await fetch(`/settings/${key}`, {
      //     method: "PUT",
      //     headers: {
      //       "Content-Type": "application/json"
      //     },
      //     body: JSON.stringify({ newValue: newValue })
      //   });
      //   console.log(response);
      // };
      if (val.type === "string") {
        gui.add(foo, val.label); //.onChange(changeFn);
        // } else if (val.type === "toggle") {
        //   foo[val.label] = val.value !== 0;
        //   gui.add(foo, val.label).onChange(async newValue => {
        //     const response = await fetch(`/settings/${key}`, {
        //       method: "PUT",
        //       headers: {},
        //       body: JSON.stringify({ newValue: (newValue && 1) || 0 })
        //     });
        //     console.log(response);
        //   });
        // } else if (val.type === "choice") {
        //   gui.add(foo, val.label, val.choices); // .onChange(changeFn);
        // } else if (val.type === "range") {
        //   gui.add(foo, val.label, val.min, val.max, val.step); //.onChange(changeFn);
      }
    }
  });
  gui.close();
}

async function loadSettings(gui) {
  const d = await fetch("/settings");
  const settings = await d.json();
  // console.log(settings);
  enumSettings(settings.main.children.status.children, gui);
}

const gui = new dat.GUI({ closed: true });

loadSettings(gui);
