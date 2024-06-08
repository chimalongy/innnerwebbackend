async function test() {
    let arrayX = ["A", "B", "C", "D"];
    let index = 0;

    async function iterateArray() {
        if (index < arrayX.length) {
            // Perform task before the setTimeout delay
            console.log("Performing a task for index: " + arrayX[index]);

            // Continue with the rest of the task or operations

            // Move to the next index after the task
            index++;

            // Set a delay using setTimeout
            setTimeout(iterateArray, 1000 * 5);
        }
       
    }

    // Start the iteration
    iterateArray()
    console.log("Actions completed")
    
   
}

// Call the function
test();
